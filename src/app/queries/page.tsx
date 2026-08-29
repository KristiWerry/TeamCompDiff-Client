"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Oxanium } from "next/font/google";
import { useAppDispatch } from "@/app/redux";
import { loadQueryPlayers } from "@/state/teamSlice";
import ConfirmModal from "@/components/ConfirmModal";
import {
  useGetQueriesQuery,
  useGetChampionsQuery,
  useDeleteQueryMutation,
  useRunQueryMutation,
  type SavedQuery,
  type PlayerInput,
} from "@/state/api";
import { BookmarkX, Eye, Loader2, Play, Trash2, User, Users } from "lucide-react";
import type { Role } from "@/lib/riot/types";
import { ROLE_LABELS } from "@/lib/riot/types";

const oxanium = Oxanium({ subsets: ["latin"], weight: ["600", "700", "800"] });

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

const CDRAG = "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions";

const ROLE_ICONS: Partial<Record<Role, string>> = {
  top:     `${CDRAG}/icon-position-top.png`,
  jungle:  `${CDRAG}/icon-position-jungle.png`,
  mid:     `${CDRAG}/icon-position-middle.png`,
  adc:     `${CDRAG}/icon-position-bottom.png`,
  support: `${CDRAG}/icon-position-utility.png`,
  fill:    `${CDRAG}/icon-position-fill.png`,
};

const ROLE_GLOW: Partial<Record<Role, string>> = {
  top:     "rgba(239,68,68,0.35)",
  jungle:  "rgba(34,197,94,0.35)",
  mid:     "rgba(139,92,246,0.45)",
  adc:     "rgba(245,158,11,0.35)",
  support: "rgba(59,130,246,0.35)",
  fill:    "rgba(255,255,255,0.2)",
};

// ── Player slot mini-card ─────────────────────────────────────────────────

function PlayerSlotCard({ player, nameToId }: {
  player: PlayerInput;
  nameToId: Record<string, string>;
}) {
  const [hovered, setHovered] = useState(false);
  const role = player.primaryRole;
  const secondaryRole = player.secondaryRole;
  const pool = player.champPool ?? [];
  const roleIcon = ROLE_ICONS[role];
  const glow = ROLE_GLOW[role] ?? "rgba(139,92,246,0.35)";

  const imageCount = pool.length === 0 ? 0 : pool.length === 1 ? 1 : pool.length <= 3 ? 2 : 4;
  const splashIds = pool.slice(0, imageCount).map((n) => nameToId[n]).filter(Boolean) as string[];

  return (
    <div className="flex flex-col gap-2">
      {/* Label above card */}
      <div className="flex flex-col gap-0.5 min-h-11 justify-center">
        {roleIcon ? (
          <>
            <div className="flex items-center gap-1.5">
              <img src={roleIcon} alt={role} className="h-4 w-4 shrink-0 object-contain opacity-90" />
              <span className="text-[11px] font-bold uppercase tracking-wider whitespace-nowrap truncate text-foreground dark:text-white/85">
                {ROLE_LABELS[role]}
              </span>
            </div>
            {role !== "fill" && secondaryRole && ROLE_ICONS[secondaryRole] && (
              <div className="flex items-center gap-1 pl-0.5">
                <img src={ROLE_ICONS[secondaryRole]} alt={secondaryRole} className="h-3 w-3 shrink-0 object-contain opacity-45" />
                <span className="text-[9px] uppercase tracking-widest whitespace-nowrap truncate text-muted-foreground/60 dark:text-white/30">
                  {ROLE_LABELS[secondaryRole]}
                </span>
              </div>
            )}
          </>
        ) : (
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30 dark:text-white/20">
            —
          </span>
        )}
      </div>

      {/* Card */}
      <div
        className="relative w-full overflow-hidden rounded-xl aspect-3/4 transition-all duration-300"
        style={{
          boxShadow: hovered
            ? `0 0 24px ${glow}, 0 0 0 1px rgba(255,255,255,0.1)`
            : "0 0 0 1px rgba(255,255,255,0.06)",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {splashIds.length === 0 ? (
          <div className="absolute inset-0 bg-muted dark:bg-zinc-900" />
        ) : splashIds.length === 1 ? (
          <img
            src={`https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${splashIds[0]}_0.jpg`}
            alt={pool[0]}
            className="absolute inset-0 h-full w-full object-cover object-top"
          />
        ) : splashIds.length === 2 ? (
          <div className="absolute inset-0 flex">
            {splashIds.map((id, i) => (
              <div key={id} className="relative flex-1 overflow-hidden">
                <img
                  src={`https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${id}_0.jpg`}
                  alt={pool[i]}
                  className="absolute inset-0 h-full w-full object-cover object-top"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
            {splashIds.map((id, i) => (
              <div key={id} className="relative overflow-hidden">
                <img
                  src={`https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${id}_0.jpg`}
                  alt={pool[i]}
                  className="absolute inset-0 h-full w-full object-cover object-top"
                />
              </div>
            ))}
          </div>
        )}

        <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/20 to-black/50" />

        {splashIds.length === 0 && roleIcon && (
          <div className="absolute inset-0 flex items-center justify-center">
            <img src={roleIcon} alt={role} className="h-14 w-14 object-contain opacity-10" />
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-2.5 space-y-0.5">
          {player.riotId ? (
            <div className="flex items-center gap-1.5">
              <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/30 ring-1 ring-primary/50">
                <User className="h-2.5 w-2.5 text-primary" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white truncate leading-none">
                {player.riotId.split("#")[0]}
              </span>
            </div>
          ) : pool.length > 0 ? (
            <>
              {pool.slice(0, 3).map((c, i) => (
                <p
                  key={c}
                  className="truncate uppercase tracking-wide leading-none"
                  style={{
                    fontSize: i === 0 ? "10px" : "9px",
                    color: i === 0 ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.35)",
                    fontWeight: i === 0 ? 700 : 400,
                  }}
                >
                  {c}
                </p>
              ))}
              {pool.length > 3 && (
                <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                  +{pool.length - 3} more
                </p>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ── Query card ────────────────────────────────────────────────────────────

function QueryCard({ query, nameToId, onDelete }: {
  query: SavedQuery;
  nameToId: Record<string, string>;
  onDelete: () => void;
}) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [runQuery, { isLoading: running }] = useRunQueryMutation();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleRun = async () => {
    try {
      await runQuery(query.queryId).unwrap();
    } catch {
      // errors visible on detail page
    }
  };

  const handleLoad = () => {
    dispatch(loadQueryPlayers(query.players));
    router.push("/");
  };

  return (
    <div className="rounded-xl overflow-hidden border border-border bg-card shadow-sm dark:bg-white/3 dark:border-white/7 dark:shadow-none">
      <div className="h-0.5 bg-gradient-primary" />

      <div className="px-5 pt-4 pb-3">
        <p className={`${oxanium.className} font-bold uppercase tracking-wide truncate text-foreground dark:text-white/85`}>
          {query.queryName}
        </p>
        <p className="text-xs mt-0.5 text-muted-foreground dark:text-white/35">
          Created {fmt(query.createdAt)}
          {query.lastRunAt && <> · Last run {fmt(query.lastRunAt)}</>}
        </p>
      </div>

      <div className="px-4 pb-3">
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${query.players.length}, minmax(0, 1fr))` }}>
          {query.players.map((player, i) => (
            <PlayerSlotCard key={i} player={player} nameToId={nameToId} />
          ))}
        </div>
      </div>

      <div className="mx-4 h-px bg-border dark:bg-white/6" />
      <div className="flex items-center gap-2 px-4 py-3 flex-wrap">
        <button
          onClick={handleRun}
          disabled={running}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50 transition-all hover:opacity-90 hover:shadow-[0_0_14px_rgba(139,92,246,0.4)] active:scale-95 bg-gradient-primary"
        >
          {running ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
          Run again
        </button>

        <button
          onClick={() => router.push(`/queries/${query.queryId}`)}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors border border-border text-foreground hover:bg-accent dark:border-white/15 dark:text-white/70 dark:hover:bg-white/5"
        >
          <Eye className="h-3 w-3" />
          View
        </button>

        <button
          onClick={handleLoad}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors border border-border text-foreground hover:bg-accent dark:border-white/15 dark:text-white/70 dark:hover:bg-white/5"
        >
          <Users className="h-3 w-3" />
          Load into Team Generator
        </button>

        <button
          onClick={() => setConfirmOpen(true)}
          className="ml-auto flex h-7 w-7 items-center justify-center rounded-full shrink-0 transition-colors bg-muted text-muted-foreground hover:text-destructive hover:bg-destructive/10 dark:bg-white/6 dark:text-white/40 dark:hover:bg-red-500/12 dark:hover:text-red-400"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {confirmOpen && (
        <ConfirmModal
          title="Delete Query"
          message={`Are you sure you want to delete "${query.queryName}"? This cannot be undone.`}
          onConfirm={() => { setConfirmOpen(false); onDelete(); }}
          onClose={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function QueriesPage() {
  const { data: champData } = useGetChampionsQuery();
  const nameToId = useMemo(
    () =>
      Object.entries(champData?.data ?? {}).reduce(
        (acc: Record<string, string>, [id, data]: [string, any]) => { acc[data.name] = id; return acc; },
        {}
      ),
    [champData]
  );

  const { data: queriesData, isLoading } = useGetQueriesQuery();
  const [deleteQuery] = useDeleteQueryMutation();

  const queries = queriesData?.queries ?? [];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className={`${oxanium.className} text-4xl sm:text-5xl font-extrabold uppercase leading-none tracking-tight text-foreground dark:text-white/90`}>
          Queries
        </h1>
        <div className="h-px w-full bg-linear-to-r from-primary/70 via-teal-500/30 to-transparent" />
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-white/40">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : queries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border dark:border-white/10 py-16 text-center">
          <BookmarkX className="h-8 w-8 mb-3 text-muted-foreground/40 dark:text-white/15" />
          <p className="text-sm font-medium text-foreground dark:text-white/60">
            No saved queries yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground dark:text-white/30">
            After adding players on Team Generator, click "Save query" to store the inputs for later.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {queries.map((query) => (
            <QueryCard
              key={query.queryId}
              query={query}
              nameToId={nameToId}
              onDelete={() => deleteQuery(query.queryId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
