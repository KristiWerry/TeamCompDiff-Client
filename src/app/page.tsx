"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/app/redux";
import { setChampData, setNumTeammates, setQueueFilter, initMatchesFromCache } from "@/state/teamSlice";
import { getChampIdMap, getLatestDDVersion } from "@/lib/champCache";
import { getCachedMatches } from "@/lib/matchCache";
import SummonerCard from "@/components/Team/SummonerCard";
import TeamStats from "@/components/Team/TeamStats";
import type { QueueFilter } from "@/lib/riot/types";
import { Users } from "lucide-react";

const QUEUE_OPTIONS: { value: QueueFilter; label: string }[] = [
  { value: "all",    label: "All (Ranked + Draft + Clash)" },
  { value: "ranked", label: "Ranked (Solo + Flex)" },
  { value: "draft",  label: "Normal Draft" },
  { value: "clash",  label: "Clash" },
];

export default function TeamPage() {
  const dispatch     = useAppDispatch();
  const queueFilter  = useAppSelector((s: any) => s.team?.queueFilter ?? "all") as QueueFilter;
  const numTeammates = useAppSelector((s: any) => s.team?.numTeammates ?? 1) as number;
  const slots        = useAppSelector((s: any) => s.team?.slots ?? []) as any[];
  const activeSlots  = slots.filter((s: any) => s.puuid).length;

  // Hydrate matches from localStorage cache on mount
  useEffect(() => {
    const cached = getCachedMatches();
    if (Object.keys(cached).length > 0) {
      dispatch(initMatchesFromCache(cached));
    }
  }, [dispatch]);

  // Load DDragon champion data once
  useEffect(() => {
    async function loadChampData() {
      try {
        const [champIdToName, ddVersion] = await Promise.all([
          getChampIdMap(),
          getLatestDDVersion(),
        ]);
        dispatch(setChampData({ champIdToName, ddVersion }));
      } catch (err) {
        console.warn("Failed to load DDragon champion data:", err);
      }
    }
    loadChampData();
  }, [dispatch]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Team Analysis</h1>
          {activeSlots > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {activeSlots}/5 summoners
            </span>
          )}
        </div>

        {/* Filters — only shown once at least one summoner is added */}
        {activeSlots > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            {/* Num Teammates */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground whitespace-nowrap">
                Min together
              </label>
              <div className="flex rounded-md border border-border overflow-hidden">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => dispatch(setNumTeammates(n))}
                    disabled={n > activeSlots}
                    className={`w-8 py-1 text-xs transition-colors disabled:opacity-30
                      ${numTeammates === n
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-foreground hover:bg-accent"}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Queue filter */}
            <select
              value={queueFilter}
              onChange={(e) => dispatch(setQueueFilter(e.target.value as QueueFilter))}
              className="rounded-md border border-input bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {QUEUE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 5 summoner cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {slots.map((slot: any) => (
          <SummonerCard key={slot.slotIndex} slotIndex={slot.slotIndex} />
        ))}
      </div>

      {/* Stats section */}
      <TeamStats />

      {/* Hint when no summoners added */}
      {activeSlots === 0 && (
        <div className="mt-4 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Add your team's summoners above to analyze champion pools, win rates, and matchups.
          <br />
          <span className="text-xs mt-1 block">
            Requires <code className="font-mono bg-muted px-1 rounded">RIOT_API_KEY</code> in your server environment.
          </span>
        </div>
      )}
    </div>
  );
}
