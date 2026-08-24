"use client";

import { useMemo } from "react";
import { useAppSelector } from "@/app/redux";
import { calculateStats } from "@/lib/statsCalc";
import { champIconUrl } from "@/lib/champCache";
import type { QueueFilter } from "@/lib/riot/types";
import { TrendingUp, TrendingDown, BarChart2 } from "lucide-react";

function WRBar({ wr }: { wr: number }) {
  const pct  = Math.round(wr * 100);
  const good = pct >= 50;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${good ? "bg-emerald-500" : "bg-red-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-semibold w-10 text-right ${good ? "text-emerald-500" : "text-red-500"}`}>
        {pct}%
      </span>
    </div>
  );
}

export default function TeamStats() {
  const slots         = useAppSelector((s: any) => s.team?.slots ?? []);
  const matches       = useAppSelector((s: any) => s.team?.matches ?? {});
  const queueFilter   = (useAppSelector((s: any) => s.team?.queueFilter ?? "all")) as QueueFilter;
  const numTeammates  = useAppSelector((s: any) => s.team?.numTeammates ?? 1) as number;
  const ddVersion     = useAppSelector((s: any) => (s.team?.ddVersion ?? "") as string);

  const puuids = (slots as any[]).map((s) => s.puuid).filter(Boolean) as string[];

  const stats = useMemo(
    () => calculateStats(puuids, matches, numTeammates, queueFilter),
    [puuids, matches, numTeammates, queueFilter]
  );

  const matchCount = Object.keys(matches).length;

  if (puuids.length === 0) return null;

  return (
    <div className="mt-6 space-y-6">
      {/* Summary bar */}
      <div className="flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-3">
        <BarChart2 className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm text-muted-foreground">
          Analyzing{" "}
          <span className="font-semibold text-foreground">{stats.totalGames}</span>{" "}
          qualifying games from{" "}
          <span className="font-semibold text-foreground">{matchCount}</span>{" "}
          total matches loaded
        </span>
        {stats.totalGames > 0 && (
          <span className="ml-auto text-sm">
            Team WR:{" "}
            <span
              className={`font-bold ${
                stats.teamWins / stats.totalGames >= 0.5 ? "text-emerald-500" : "text-red-500"
              }`}
            >
              {Math.round((stats.teamWins / stats.totalGames) * 100)}%
            </span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Best champion combos */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-5 py-3">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-foreground">Best Champion Combos</h3>
          </div>
          {stats.champCombos.length === 0 ? (
            <p className="px-5 py-6 text-xs text-muted-foreground text-center">
              Not enough data yet (need ≥3 games per combo)
            </p>
          ) : (
            <div className="divide-y divide-border">
              {stats.champCombos.map((c, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-2.5">
                  {/* Champion icons */}
                  <div className="flex gap-0.5 shrink-0">
                    {c.champions.map((champ) =>
                      ddVersion ? (
                        <img
                          key={champ}
                          src={champIconUrl(ddVersion, champ)}
                          alt={champ}
                          title={champ}
                          className="h-7 w-7 rounded border border-border"
                        />
                      ) : (
                        <div key={champ} className="h-7 w-7 rounded bg-muted text-[8px] flex items-center justify-center">
                          {champ.slice(0, 3)}
                        </div>
                      )
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground truncate">
                      {c.champions.join(" + ")}
                    </div>
                    <WRBar wr={c.winRate} />
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 w-14 text-right">
                    {c.wins}W {c.total - c.wins}L
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Worst enemy matchups */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-5 py-3">
            <TrendingDown className="h-4 w-4 text-red-500" />
            <h3 className="text-sm font-semibold text-foreground">Hardest Enemy Matchups</h3>
          </div>
          {stats.enemyMatchups.length === 0 ? (
            <p className="px-5 py-6 text-xs text-muted-foreground text-center">
              Not enough data yet (need ≥3 games per champion)
            </p>
          ) : (
            <div className="divide-y divide-border">
              {stats.enemyMatchups.map((m, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-2.5">
                  {ddVersion ? (
                    <img
                      src={champIconUrl(ddVersion, m.championName)}
                      alt={m.championName}
                      className="h-7 w-7 rounded border border-border shrink-0"
                    />
                  ) : (
                    <div className="h-7 w-7 rounded bg-muted shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-foreground font-medium">{m.championName}</div>
                    <WRBar wr={m.teamWinRate} />
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 w-14 text-right">
                    {m.teamWins}W {m.teamGames - m.teamWins}L
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
