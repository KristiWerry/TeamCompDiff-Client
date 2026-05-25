"use client";

import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/redux";
import {
  clearSlot,
  setSummonerData,
  setPreviousSeasonRank,
} from "@/state/teamSlice";
import { useMatchLoader } from "@/hooks/useMatchLoader";
import { champIconUrl, profileIconUrl } from "@/lib/champCache";
import { REGIONS } from "@/lib/riot/regions";
import type { Region, RankEntry } from "@/lib/riot/types";
import { X, Plus, Loader2, ChevronDown, Pencil, CheckCircle } from "lucide-react";
import ChampionPoolEditor from "./ChampionPoolEditor";

const TIER_COLORS: Record<string, string> = {
  IRON:         "text-gray-400",
  BRONZE:       "text-amber-700",
  SILVER:       "text-gray-300",
  GOLD:         "text-yellow-400",
  PLATINUM:     "text-teal-400",
  EMERALD:      "text-emerald-400",
  DIAMOND:      "text-blue-400",
  MASTER:       "text-purple-500",
  GRANDMASTER:  "text-red-500",
  CHALLENGER:   "text-yellow-300",
};

function RankBadge({ entry }: { entry?: RankEntry }) {
  if (!entry) return <span className="text-xs text-muted-foreground">Unranked</span>;
  const color = TIER_COLORS[entry.tier] ?? "text-muted-foreground";
  const wr = Math.round((entry.wins / (entry.wins + entry.losses)) * 100);
  return (
    <div>
      <span className={`text-sm font-semibold ${color}`}>
        {entry.tier.charAt(0) + entry.tier.slice(1).toLowerCase()} {entry.rank}
      </span>
      <span className="ml-1 text-xs text-muted-foreground">{entry.leaguePoints} LP</span>
      <div className="text-xs text-muted-foreground">
        {entry.wins}W {entry.losses}L · {wr}% WR
      </div>
    </div>
  );
}

function AddSummonerForm({ slotIndex }: { slotIndex: number }) {
  const dispatch = useAppDispatch();
  const { startLoading } = useMatchLoader(slotIndex);

  const [input,  setInput]  = useState("");
  const [region, setRegion] = useState<Region>("NA1");
  const [loading, setLoading] = useState(false);
  const [error,  setError]  = useState("");
  const [showRegions, setShowRegions] = useState(false);

  const regionLabel = REGIONS.find((r: any) => r.value === region)?.label ?? region;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const [gameName, ...tagParts] = input.trim().split("#");
    const tagLine = tagParts.join("#");
    if (!gameName || !tagLine) {
      setError("Format: GameName#Tag");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/riot/summoner?gameName=${encodeURIComponent(gameName)}&tagLine=${encodeURIComponent(tagLine)}&region=${region}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to find summoner");

      dispatch(setSummonerData({
        slotIndex,
        data: {
          gameName:      data.gameName,
          tagLine:       data.tagLine,
          region,
          puuid:         data.puuid,
          summonerId:    data.id,
          profileIconId: data.profileIconId,
          summonerLevel: data.summonerLevel,
        },
      }));

      // Kick off background match loading (rank + mastery + matches)
      startLoading(data.puuid, data.id, region);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 p-4">
      <Plus className="h-8 w-8 text-muted-foreground/50" />
      <p className="text-xs text-muted-foreground text-center">Add summoner</p>
      <form onSubmit={handleSubmit} className="w-full space-y-2">
        <input
          type="text"
          placeholder="GameName#Tag"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
        />
        {/* Region picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowRegions((p) => !p)}
            className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-accent"
          >
            {regionLabel}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          {showRegions && (
            <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md grid grid-cols-3 gap-px p-1 max-h-48 overflow-y-auto">
              {REGIONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => { setRegion(r.value); setShowRegions(false); }}
                  className={`rounded px-2 py-1 text-xs text-center hover:bg-accent ${region === r.value ? "bg-primary text-primary-foreground" : ""}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="w-full rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {loading ? "Loading..." : "Add Summoner"}
        </button>
      </form>
    </div>
  );
}

interface SummonerCardProps {
  slotIndex: number;
}

export default function SummonerCard({ slotIndex }: SummonerCardProps) {
  const dispatch  = useAppDispatch();
  const slot      = useAppSelector((s: any) => s.team?.slots?.[slotIndex]) as any;
  const ddVersion = useAppSelector((s: any) => (s.team?.ddVersion ?? "") as string);
  const { startLoading, stopLoading } = useMatchLoader(slotIndex);

  const [editingRank, setEditingRank] = useState(false);
  const [prevRankDraft, setPrevRankDraft] = useState("");
  const [showPoolEditor, setShowPoolEditor] = useState(false);

  const isEmpty = !slot.puuid;

  const soloQ = slot.rankInfo?.find((r: any) => r.queueType === "RANKED_SOLO_5x5");
  const flexQ = slot.rankInfo?.find((r: any) => r.queueType === "RANKED_FLEX_SR");

  const pool = slot.customChampPool ?? slot.championPool ?? [];

  const progressPct = slot.matchesTotal
    ? Math.round((slot.matchesLoaded / slot.matchesTotal) * 100)
    : 0;

  const handleClear = () => {
    stopLoading();
    dispatch(clearSlot(slotIndex));
  };

  const handleLoadPrevSeason = () => {
    if (slot.puuid && slot.summonerId && slot.region) {
      startLoading(slot.puuid, slot.summonerId, slot.region, true);
    }
  };

  return (
    <div className="relative flex flex-col rounded-xl border border-border bg-card shadow-sm min-h-[320px]">
      {/* ── Empty state ───────────────────────────────────── */}
      {isEmpty ? (
        <AddSummonerForm slotIndex={slotIndex} />
      ) : (
        <>
          {/* Remove button */}
          <button
            onClick={handleClear}
            className="absolute top-2 right-2 rounded-full p-1 hover:bg-destructive/10 z-10"
            title="Remove summoner"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
          </button>

          <div className="p-4 space-y-3">
            {/* Header: icon + name */}
            <div className="flex items-center gap-3">
              {ddVersion && slot.profileIconId ? (
                <img
                  src={profileIconUrl(ddVersion, slot.profileIconId)}
                  alt="icon"
                  className="h-12 w-12 rounded-full border border-border"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-muted" />
              )}
              <div className="min-w-0">
                <div className="font-semibold text-foreground truncate leading-tight">
                  {slot.gameName}
                  <span className="text-muted-foreground text-xs font-normal ml-0.5">
                    #{slot.tagLine}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {REGIONS.find((r: any) => r.value === slot.region)?.label} · Lv {slot.summonerLevel}
                </div>
              </div>
            </div>

            {/* Rank */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-muted-foreground mb-0.5">Solo/Duo</div>
                <RankBadge entry={soloQ} />
              </div>
              <div>
                <div className="text-muted-foreground mb-0.5">Flex</div>
                <RankBadge entry={flexQ} />
              </div>
            </div>

            {/* Previous season rank */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0">S2024 peak:</span>
              {editingRank ? (
                <>
                  <input
                    autoFocus
                    type="text"
                    value={prevRankDraft}
                    onChange={(e) => setPrevRankDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        dispatch(setPreviousSeasonRank({ slotIndex, rank: prevRankDraft }));
                        setEditingRank(false);
                      } else if (e.key === "Escape") {
                        setEditingRank(false);
                      }
                    }}
                    placeholder="e.g. Gold II"
                    className="flex-1 min-w-0 rounded border border-input bg-background px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <button
                    onClick={() => {
                      dispatch(setPreviousSeasonRank({ slotIndex, rank: prevRankDraft }));
                      setEditingRank(false);
                    }}
                  >
                    <CheckCircle className="h-3.5 w-3.5 text-primary" />
                  </button>
                </>
              ) : (
                <>
                  <span className="text-xs text-foreground flex-1 truncate">
                    {slot.previousSeasonRank || <span className="text-muted-foreground/60 italic">—</span>}
                  </span>
                  <button
                    onClick={() => { setPrevRankDraft(slot.previousSeasonRank ?? ""); setEditingRank(true); }}
                    className="shrink-0"
                  >
                    <Pencil className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </>
              )}
            </div>

            {/* Champion pool */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-muted-foreground">Champion Pool</span>
                <button
                  onClick={() => setShowPoolEditor(true)}
                  className="text-xs text-primary hover:underline"
                >
                  Edit
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {pool.slice(0, 10).map((c: any) => (
                  <div key={c.championId} title={c.championName ?? String(c.championId)}>
                    {ddVersion && c.championName ? (
                      <img
                        src={champIconUrl(ddVersion, c.championName)}
                        alt={c.championName}
                        className="h-7 w-7 rounded border border-border"
                      />
                    ) : (
                      <div className="h-7 w-7 rounded bg-muted flex items-center justify-center text-[9px] text-muted-foreground">
                        {c.championId}
                      </div>
                    )}
                  </div>
                ))}
                {pool.length === 0 && (
                  <span className="text-xs text-muted-foreground/60 italic">Loading…</span>
                )}
              </div>
            </div>

            {/* Match loading progress */}
            {(slot.matchesLoading || slot.matchesTotal > 0) && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    {slot.matchesLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                    <span>
                      {slot.matchesLoading
                        ? `Loading matches… ${slot.matchesLoaded}/${slot.matchesTotal}`
                        : `${slot.matchesLoaded} matches loaded`}
                    </span>
                  </div>
                  {slot.loaded && !slot.prevSeasonLoaded && (
                    <button
                      onClick={handleLoadPrevSeason}
                      disabled={slot.matchesLoading}
                      className="text-primary hover:underline disabled:opacity-50"
                    >
                      + S2024
                    </button>
                  )}
                </div>
                {slot.matchesTotal > 0 && (
                  <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {slot.error && (
              <p className="text-xs text-destructive">{slot.error}</p>
            )}
          </div>
        </>
      )}

      {/* Champion pool editor modal */}
      {showPoolEditor && (
        <ChampionPoolEditor
          slotIndex={slotIndex}
          onClose={() => setShowPoolEditor(false)}
        />
      )}
    </div>
  );
}
