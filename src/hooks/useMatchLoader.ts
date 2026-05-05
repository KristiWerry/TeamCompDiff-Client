"use client";

import { useCallback, useRef } from "react";
import { useAppDispatch } from "@/app/redux";
import {
  addMatchIds,
  addMatches,
  setMatchesLoaded,
  setMatchesLoading,
  setSummonerData,
} from "@/state/teamSlice";
import {
  getCachedMatches,
  getUncachedIds,
  saveMatches,
} from "@/lib/matchCache";
import type { Region, MatchData } from "@/lib/riot/types";
import { SEASON_2024_START, SEASON_2024_END, SEASON_2025_START } from "@/lib/riot/types";

const QUEUES     = [420, 440, 400, 700];
const DELAY_MS   = 200; // stay well within 20 req/s dev key limit
const MAX_PER_Q  = 200; // max match IDs per queue per season (2 pages of 100)

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

async function fetchJSON<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.json();
}

async function fetchMatchIds(
  puuid: string,
  region: Region,
  queue: number,
  startTime: number,
  endTime?: number,
  signal?: AbortSignal
): Promise<string[]> {
  const all: string[] = [];
  let start = 0;
  while (all.length < MAX_PER_Q) {
    if (signal?.aborted) break;
    const params = new URLSearchParams({
      puuid, region,
      queue:     String(queue),
      startTime: String(startTime),
      start:     String(start),
      count:     "100",
    });
    if (endTime) params.set("endTime", String(endTime));

    const ids = await fetchJSON<string[]>(`/api/riot/matches?${params}`, signal);
    if (!Array.isArray(ids) || ids.length === 0) break;
    all.push(...ids);
    start += ids.length;
    if (ids.length < 100) break;
    await sleep(DELAY_MS);
  }
  return all;
}

export function useMatchLoader(slotIndex: number) {
  const dispatch    = useAppDispatch();
  const abortRef    = useRef<AbortController | null>(null);
  const runningRef  = useRef(false);

  const startLoading = useCallback(
    async (
      puuid: string,
      summonerId: string,
      region: Region,
      includePrevSeason = false
    ) => {
      if (runningRef.current) return;
      runningRef.current = true;
      abortRef.current   = new AbortController();
      const { signal }   = abortRef.current;

      dispatch(setMatchesLoading({ slotIndex, loading: true }));
      dispatch(setSummonerData({ slotIndex, data: { error: undefined } }));

      try {
        // ── Fetch rank & mastery in parallel ───────────────────────────
        const [rankData, masteryData] = await Promise.all([
          fetchJSON<any[]>(`/api/riot/rank?summonerId=${summonerId}&region=${region}`, signal),
          fetchJSON<any[]>(`/api/riot/mastery?puuid=${puuid}&region=${region}&count=10`, signal),
        ]);
        dispatch(setSummonerData({ slotIndex, data: { rankInfo: rankData, championPool: masteryData } }));

        await sleep(DELAY_MS);

        // ── Collect match IDs ──────────────────────────────────────────
        const idSet = new Set<string>();

        for (const queue of QUEUES) {
          if (signal.aborted) break;
          const ids = await fetchMatchIds(puuid, region, queue, SEASON_2025_START, undefined, signal);
          ids.forEach((id) => idSet.add(id));
          await sleep(DELAY_MS);
        }

        if (includePrevSeason) {
          for (const queue of QUEUES) {
            if (signal.aborted) break;
            const ids = await fetchMatchIds(puuid, region, queue, SEASON_2024_START, SEASON_2024_END, signal);
            ids.forEach((id) => idSet.add(id));
            await sleep(DELAY_MS);
          }
        }

        const allIds = Array.from(idSet);
        dispatch(addMatchIds({ slotIndex, matchIds: allIds }));

        // ── Hydrate from localStorage cache first ──────────────────────
        const cached = getCachedMatches();
        const cachedHits = allIds.flatMap((id) => (cached[id] ? [cached[id]] : []));
        if (cachedHits.length > 0) {
          dispatch(addMatches(cachedHits));
          dispatch(setMatchesLoaded({ slotIndex, count: cachedHits.length }));
        }

        // ── Fetch uncached matches ─────────────────────────────────────
        const uncached = getUncachedIds(allIds);
        let fetched = cachedHits.length;

        for (const matchId of uncached) {
          if (signal.aborted) break;
          try {
            const match = await fetchJSON<MatchData>(
              `/api/riot/match?matchId=${matchId}&region=${region}`,
              signal
            );
            if (match?.matchId) {
              saveMatches([match]);
              dispatch(addMatches([match]));
            }
          } catch {
            // skip individual match failures
          }
          fetched++;
          dispatch(setMatchesLoaded({ slotIndex, count: fetched }));
          await sleep(DELAY_MS);
        }

        if (!includePrevSeason) {
          dispatch(setSummonerData({ slotIndex, data: { loaded: true } }));
        } else {
          dispatch(setSummonerData({ slotIndex, data: { loaded: true, prevSeasonLoaded: true } }));
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          dispatch(setSummonerData({ slotIndex, data: { error: err.message } }));
        }
      } finally {
        runningRef.current = false;
        dispatch(setMatchesLoading({ slotIndex, loading: false }));
      }
    },
    [slotIndex, dispatch]
  );

  const stopLoading = useCallback(() => {
    abortRef.current?.abort();
    runningRef.current = false;
  }, []);

  return { startLoading, stopLoading };
}
