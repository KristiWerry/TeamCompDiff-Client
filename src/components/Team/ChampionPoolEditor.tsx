"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/redux";
import { setCustomChampPool } from "@/state/teamSlice";
import type { ChampionMastery } from "@/lib/riot/types";
import { champIconUrl } from "@/lib/champCache";
import { X, Search } from "lucide-react";

interface Props {
  slotIndex: number;
  onClose: () => void;
}

export default function ChampionPoolEditor({ slotIndex, onClose }: Props) {
  const dispatch    = useAppDispatch();
  const slot        = useAppSelector((s: any) => s.team?.slots?.[slotIndex]);
  const champMap    = useAppSelector((s: any) => (s.team?.champIdToName ?? {}) as Record<number, string>);
  const ddVersion   = useAppSelector((s: any) => (s.team?.ddVersion ?? "") as string);

  const basePool = slot.customChampPool ?? slot.championPool ?? [];
  const [pool, setPool]       = useState<ChampionMastery[]>(basePool);
  const [search, setSearch]   = useState("");
  const [allChamps, setAllChamps] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    const list = (Object.entries(champMap) as [string, string][]).map(([id, name]) => ({
      id: Number(id),
      name,
    }));
    list.sort((a, b) => a.name.localeCompare(b.name));
    setAllChamps(list);
  }, [champMap]);

  const poolIds = new Set(pool.map((c) => c.championId));

  const filtered = allChamps.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) && !poolIds.has(c.id)
  );

  const addChamp = (id: number, name: string) => {
    setPool((prev) => [
      ...prev,
      { championId: id, championName: name, championLevel: 1, championPoints: 0, lastPlayTime: 0 },
    ]);
  };

  const removeChamp = (id: number) => {
    setPool((prev) => prev.filter((c) => c.championId !== id));
  };

  const handleSave = () => {
    dispatch(setCustomChampPool({ slotIndex, pool }));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">Edit Champion Pool</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-accent">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Current pool */}
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Current Pool ({pool.length})
            </p>
            <div className="flex flex-wrap gap-1.5 min-h-10">
              {pool.map((c) => (
                <div
                  key={c.championId}
                  className="relative group"
                  title={c.championName}
                >
                  {ddVersion && c.championName ? (
                    <img
                      src={champIconUrl(ddVersion, c.championName)}
                      alt={c.championName}
                      className="h-9 w-9 rounded border border-border"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded bg-muted flex items-center justify-center text-[9px]">
                      {c.championId}
                    </div>
                  )}
                  <button
                    onClick={() => removeChamp(c.championId)}
                    className="absolute -top-1 -right-1 hidden group-hover:flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
              {pool.length === 0 && (
                <span className="text-xs text-muted-foreground italic">No champions selected</span>
              )}
            </div>
          </div>

          {/* Champion search */}
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Add Champions
            </p>
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search champions…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border border-input bg-background pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="grid grid-cols-5 gap-1.5 max-h-40 overflow-y-auto rounded-md border border-border p-2 bg-background">
              {filtered.slice(0, 60).map((c) => (
                <button
                  key={c.id}
                  onClick={() => addChamp(c.id, c.name)}
                  title={c.name}
                  className="flex flex-col items-center gap-0.5 hover:bg-accent rounded p-1 text-[9px] text-muted-foreground"
                >
                  {ddVersion ? (
                    <img
                      src={champIconUrl(ddVersion, c.name)}
                      alt={c.name}
                      className="h-8 w-8 rounded border border-border"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded bg-muted" />
                  )}
                  <span className="truncate w-full text-center leading-tight">{c.name}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <span className="col-span-5 text-xs text-muted-foreground text-center py-4">
                  No results
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-1.5 text-sm text-muted-foreground hover:bg-accent"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Save Pool
          </button>
        </div>
      </div>
    </div>
  );
}
