"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Oxanium } from "next/font/google";
import { useAppDispatch } from "@/app/redux";
import { loadQueryPlayers } from "@/state/teamSlice";
import ChampionPicker from "@/components/ChampionPicker";
import ConfirmModal from "@/components/ConfirmModal";
import {
  useGetQueriesQuery,
  useGetChampionsQuery,
  useDeleteQueryMutation,
  useUpdateQueryMutation,
  useRunQueryMutation,
  type TeamCompResponse,
  type PlayerInput,
} from "@/state/api";
import type { Role } from "@/lib/riot/types";
import { ALL_ROLES, ROLE_LABELS } from "@/lib/riot/types";
import {
  AlertTriangle,
  Edit2,
  Loader2,
  Pencil,
  Play,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";

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

const ROLE_BG: Partial<Record<Role, string>> = {
  top:     "rgba(239,68,68,0.15)",
  jungle:  "rgba(34,197,94,0.15)",
  mid:     "rgba(139,92,246,0.15)",
  adc:     "rgba(245,158,11,0.15)",
  support: "rgba(59,130,246,0.15)",
  fill:    "rgba(255,255,255,0.08)",
};

const ROLE_BORDER: Partial<Record<Role, string>> = {
  top:     "rgba(239,68,68,0.45)",
  jungle:  "rgba(34,197,94,0.45)",
  mid:     "rgba(139,92,246,0.5)",
  adc:     "rgba(245,158,11,0.45)",
  support: "rgba(59,130,246,0.45)",
  fill:    "rgba(255,255,255,0.3)",
};

const ARCHETYPE_CFG: Record<string, { color: string; bg: string; border: string }> = {
  "Teamfight":    { color: "#60A5FA", bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.3)"  },
  "Poke / Siege": { color: "#FBBF24", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.3)"  },
  "Pick Comp":    { color: "#F87171", bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.3)"   },
  "Split Push":   { color: "#34D399", bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.3)"  },
  "Early Game":   { color: "#FB923C", bg: "rgba(249,115,22,0.12)",  border: "rgba(249,115,22,0.3)"  },
};
const DEFAULT_ARCH_CFG = { color: "#A78BFA", bg: "rgba(139,92,246,0.12)", border: "rgba(139,92,246,0.3)" };
const archetypeCfg = (a: string) => ARCHETYPE_CFG[a] ?? DEFAULT_ARCH_CFG;

// ── Edit slot modal ───────────────────────────────────────────────────────

function EditSlotModal({
  player,
  saving,
  onSave,
  onClose,
}: {
  player: PlayerInput;
  saving: boolean;
  onSave: (updated: PlayerInput) => void;
  onClose: () => void;
}) {
  const [primaryRole, setPrimaryRole] = useState<Role>(player.primaryRole);
  const [secondaryRole, setSecondaryRole] = useState<Role | undefined>(player.secondaryRole);
  const [riotIdInput, setRiotIdInput] = useState(player.riotId ?? "");
  const [champPool, setChampPool] = useState<string[]>(player.champPool ?? []);
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleSave = () => {
    onSave({
      primaryRole,
      secondaryRole: primaryRole === "fill" ? undefined : secondaryRole,
      riotId: riotIdInput.trim() || undefined,
      champPool: champPool.length > 0 ? champPool : undefined,
    });
  };

  const roleButtonStyle = (role: Role, isActive: boolean) =>
    isActive ? {
      background: ROLE_BG[role],
      border: `1px solid ${ROLE_BORDER[role]}`,
      boxShadow: `0 0 10px ${ROLE_GLOW[role]}`,
    } : undefined;

  return (
    <>
      <div
        className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-sm rounded-xl overflow-hidden shadow-2xl bg-card border border-border dark:bg-[#0d0d14] dark:border-white/7"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border dark:border-white/7">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-foreground dark:text-white/90">
              Configure Slot
            </h2>
            <button
              onClick={onClose}
              className="rounded p-1 transition-colors text-muted-foreground hover:text-foreground hover:bg-accent dark:text-white/30 dark:hover:text-white/70"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Riot Account */}
            <div>
              <div className="flex items-baseline gap-2 mb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-white/35">
                  Riot Account
                </p>
                <span className="text-[9px] italic text-muted-foreground/50 dark:text-white/20">
                  *optional
                </span>
              </div>
              <input
                type="text"
                placeholder="GameName#Tag"
                value={riotIdInput}
                onChange={(e) => setRiotIdInput(e.target.value)}
                className="w-full rounded px-2 py-1.5 text-xs outline-none text-foreground placeholder:text-muted-foreground bg-background border border-input focus:border-primary/50 dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-white/20 dark:focus:border-primary/50"
              />
            </div>

            {/* Primary Role */}
            <div className="border-t border-border dark:border-white/7 pt-5">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-white/35">
                Primary Role
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {([...ALL_ROLES, "fill"] as Role[]).map((role) => {
                  const isActive = primaryRole === role;
                  return (
                    <button
                      key={role}
                      onClick={() => {
                        setPrimaryRole(role);
                        if (role === "fill") setSecondaryRole(undefined);
                        if (secondaryRole === role) setSecondaryRole(undefined);
                      }}
                      title={ROLE_LABELS[role]}
                      className={`flex h-9 w-9 items-center justify-center rounded transition-all duration-150 ${!isActive ? "bg-muted border border-border hover:bg-accent dark:bg-white/3 dark:border-white/7" : ""}`}
                      style={roleButtonStyle(role, isActive)}
                    >
                      {ROLE_ICONS[role] && (
                        <img
                          src={ROLE_ICONS[role]}
                          alt={role}
                          className="h-5 w-5 object-contain"
                          style={{ opacity: isActive ? 1 : 0.65 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Secondary Role */}
            {primaryRole !== "fill" && (
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-white/35">
                  Secondary Role
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    onClick={() => setSecondaryRole(undefined)}
                    title="None"
                    className={`flex h-9 w-9 items-center justify-center rounded transition-all duration-150 ${!secondaryRole ? "bg-muted border border-border dark:bg-white/10 dark:border-white/25" : "bg-muted border border-border hover:bg-accent dark:bg-white/3 dark:border-white/7"}`}
                  >
                    <span className="text-xs font-bold text-muted-foreground dark:text-white/40">—</span>
                  </button>
                  {([...ALL_ROLES, "fill"] as Role[]).filter((r) => r !== primaryRole).map((role) => {
                    const isActive = secondaryRole === role;
                    return (
                      <button
                        key={role}
                        onClick={() => setSecondaryRole(role)}
                        title={ROLE_LABELS[role]}
                        className={`flex h-9 w-9 items-center justify-center rounded transition-all duration-150 ${!isActive ? "bg-muted border border-border hover:bg-accent dark:bg-white/3 dark:border-white/7" : ""}`}
                        style={roleButtonStyle(role, isActive)}
                      >
                        {ROLE_ICONS[role] && (
                          <img
                            src={ROLE_ICONS[role]}
                            alt={role}
                            className="h-5 w-5 object-contain"
                            style={{ opacity: isActive ? 1 : 0.65 }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Champion Pool */}
            <div className="border-t border-border dark:border-white/7 pt-5">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-white/35">
                  Champion Pool
                </span>
                <button
                  onClick={() => setPickerOpen(true)}
                  className="text-[10px] font-bold uppercase tracking-wider transition-colors text-primary hover:text-primary/70 dark:text-primary/80 dark:hover:text-primary"
                >
                  {champPool.length > 0 ? `Change Pool · ${champPool.length}` : "+ Select Champions"}
                </button>
              </div>
              {champPool.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {champPool.slice(0, 8).map((c) => (
                    <span
                      key={c}
                      className="rounded px-2 py-0.5 text-[10px] font-medium bg-primary/10 border border-primary/20 text-primary dark:bg-primary/12 dark:border-primary/25 dark:text-primary/90"
                    >
                      {c}
                    </span>
                  ))}
                  {champPool.length > 8 && (
                    <span className="text-[10px] text-muted-foreground dark:text-white/30">
                      +{champPool.length - 8} more
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground/50 dark:text-white/25">
                  No pool set.
                </p>
              )}
            </div>
          </div>

          {/* Save */}
          <div className="px-5 pb-5">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-lg py-2.5 text-sm font-black uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-50 text-white bg-gradient-primary"
              style={{ boxShadow: "0 0 20px rgba(139,92,246,0.35)" }}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Save"}
            </button>
          </div>
        </div>
      </div>

      {pickerOpen && (
        <ChampionPicker
          selected={champPool}
          onChange={setChampPool}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  );
}

// ── Player slot card (clickable) ──────────────────────────────────────────

function PlayerSlotCard({
  player,
  nameToId,
  onClick,
}: {
  player: PlayerInput;
  nameToId: Record<string, string>;
  onClick: () => void;
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
            <div className="flex items-center gap-2">
              <img src={roleIcon} alt={role} className="h-5 w-5 shrink-0 object-contain opacity-90" />
              <span className="text-sm font-bold uppercase tracking-wider whitespace-nowrap text-foreground dark:text-white/85">
                {ROLE_LABELS[role]}
              </span>
            </div>
            {role !== "fill" && secondaryRole && ROLE_ICONS[secondaryRole] && (
              <div className="flex items-center gap-1.5 pl-0.5">
                <img
                  src={ROLE_ICONS[secondaryRole]}
                  alt={secondaryRole}
                  className="h-3.5 w-3.5 shrink-0 object-contain opacity-50"
                />
                <span className="text-[10px] uppercase tracking-widest whitespace-nowrap text-muted-foreground/60 dark:text-white/30">
                  {ROLE_LABELS[secondaryRole]}
                </span>
              </div>
            )}
          </>
        ) : (
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/30 dark:text-white/20">
            —
          </span>
        )}
      </div>

      {/* Card */}
      <button
        onClick={onClick}
        className="group relative w-full overflow-hidden rounded-xl aspect-3/4 text-left transition-all duration-300 hover:scale-[1.02]"
        style={{
          boxShadow: hovered
            ? `0 0 28px ${glow}, 0 0 0 1px rgba(255,255,255,0.1)`
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
            className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          />
        ) : splashIds.length === 2 ? (
          <div className="absolute inset-0 flex">
            {splashIds.map((sid, i) => (
              <div key={sid} className="relative flex-1 overflow-hidden">
                <img
                  src={`https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${sid}_0.jpg`}
                  alt={pool[i]}
                  className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
            {splashIds.map((sid, i) => (
              <div key={sid} className="relative overflow-hidden">
                <img
                  src={`https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${sid}_0.jpg`}
                  alt={pool[i]}
                  className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        )}

        <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/20 to-black/50" />

        {splashIds.length === 0 && roleIcon && (
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src={roleIcon}
              alt={role}
              className="h-20 w-20 object-contain opacity-10 transition-opacity duration-300 group-hover:opacity-20"
            />
          </div>
        )}

        <div
          className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full transition-opacity duration-200"
          style={{
            background: "rgba(0,0,0,0.6)",
            border: "1px solid rgba(255,255,255,0.15)",
            opacity: hovered ? 1 : 0,
          }}
        >
          <Pencil className="h-3 w-3 text-white/70" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-2.5 space-y-1.5">
          {player.riotId && (
            <div className="flex items-center gap-1.5">
              <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/30 ring-1 ring-primary/50">
                <User className="h-2.5 w-2.5 text-primary" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-white truncate leading-none">
                {player.riotId.split("#")[0]}
              </span>
            </div>
          )}
          {pool.length > imageCount && (
            <div className="flex flex-wrap gap-1">
              {pool.slice(imageCount, imageCount + 10).map((c) => {
                const cid = nameToId[c];
                return cid ? (
                  <img
                    key={c}
                    src={`https://ddragon.leagueoflegends.com/cdn/16.16.1/img/champion/${cid}.png`}
                    alt={c}
                    title={c}
                    className="h-6 w-6 rounded object-cover ring-1 ring-black/40"
                  />
                ) : (
                  <span key={c} className="text-[9px] leading-none" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {c}
                  </span>
                );
              })}
              {pool.length > imageCount + 10 && (
                <span
                  className="flex h-6 w-6 items-center justify-center rounded text-[9px] font-bold ring-1 ring-black/40"
                  style={{ background: "rgba(0,0,0,0.5)", color: "rgba(255,255,255,0.5)" }}
                >
                  +{pool.length - imageCount - 10}
                </span>
              )}
            </div>
          )}
        </div>
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function QueryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { data: queriesData, isLoading } = useGetQueriesQuery();
  const { data: champData } = useGetChampionsQuery();
  const [deleteQuery, { isLoading: deleting }] = useDeleteQueryMutation();
  const [updateQuery, { isLoading: saving }] = useUpdateQueryMutation();
  const [runQuery, { isLoading: running }] = useRunQueryMutation();

  const nameToId = useMemo(
    () =>
      Object.entries(champData?.data ?? {}).reduce(
        (acc: Record<string, string>, [cid, data]: [string, any]) => { acc[data.name] = cid; return acc; },
        {}
      ),
    [champData]
  );

  const query = queriesData?.queries.find((q) => q.queryId === id);

  const [lastResult, setLastResult] = useState<TeamCompResponse | null>(null);
  const effectiveResult = lastResult ?? query?.lastResult ?? null;

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editSlotIdx, setEditSlotIdx] = useState<number | null>(null);
  const [runError, setRunError] = useState("");

  const handleDelete = async () => {
    if (!query) return;
    await deleteQuery(query.queryId);
    router.push("/queries");
  };

  const handleRenameOpen = () => {
    setRenameValue(query?.queryName ?? "");
    setRenameOpen(true);
  };

  const handleRenameSave = async () => {
    if (!query || !renameValue.trim()) return;
    await updateQuery({ queryId: query.queryId, queryName: renameValue.trim() });
    setRenameOpen(false);
  };

  const handleSlotSave = async (idx: number, updated: PlayerInput) => {
    if (!query) return;
    const updatedPlayers = query.players.map((p, i) => i === idx ? updated : p);
    await updateQuery({ queryId: query.queryId, players: updatedPlayers });
    setEditSlotIdx(null);
  };

  const handleRun = async () => {
    if (!query) return;
    setRunError("");
    try {
      const res = await runQuery(query.queryId).unwrap();
      setLastResult(res);
    } catch (err: any) {
      setRunError(err?.data?.message ?? "Run failed.");
    }
  };

  const handleLoad = () => {
    if (!query) return;
    dispatch(loadQueryPlayers(query.players));
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm py-12 justify-center text-muted-foreground dark:text-white/40">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  if (!query) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertTriangle className="h-8 w-8 text-muted-foreground/40 dark:text-white/15" />
        <p className="text-sm text-muted-foreground dark:text-white/35">Query not found.</p>
        <Link href="/queries" className="text-xs text-primary hover:underline">
          Back to queries
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Title */}
      <div className="space-y-1">
        <div className="flex items-start gap-2">
          <h1 className={`${oxanium.className} text-4xl sm:text-5xl font-extrabold uppercase leading-none tracking-tight flex-1 min-w-0 text-foreground dark:text-white/90`}>
            {query.queryName}
          </h1>
          <button
            onClick={handleRenameOpen}
            className="mt-1 shrink-0 rounded p-1.5 transition-colors border border-border text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-accent dark:border-white/12 dark:text-white/30 dark:hover:text-white/75 dark:hover:border-white/25"
            title="Rename"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={deleting}
            className="mt-1 shrink-0 rounded p-1.5 transition-colors disabled:opacity-50 border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 hover:bg-destructive/5 dark:border-white/12 dark:text-white/30 dark:hover:text-red-400/80 dark:hover:border-red-500/35"
            title="Delete"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </button>
        </div>
        <div className="h-px w-full bg-linear-to-r from-primary/70 via-teal-500/30 to-transparent" />
        <p className="text-xs pt-0.5 text-muted-foreground dark:text-white/30">
          Created {fmt(query.createdAt)}
          {query.lastRunAt && <> · Last run {fmt(query.lastRunAt)}</>}
        </p>
      </div>

      {/* Rename modal */}
      {renameOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          onClick={() => setRenameOpen(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-xl p-6 shadow-2xl bg-card border border-border dark:bg-[#0d0d14] dark:border-white/9"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-black uppercase tracking-widest text-foreground dark:text-white/90">
                Rename Query
              </p>
              <button
                onClick={() => setRenameOpen(false)}
                className="rounded p-1 transition-colors text-muted-foreground hover:text-foreground hover:bg-accent dark:text-white/30 dark:hover:text-white/70"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameSave();
                if (e.key === "Escape") setRenameOpen(false);
              }}
              className="w-full rounded-md px-3 py-2 text-sm outline-none mb-4 border border-border bg-background text-foreground focus:border-primary/50 dark:bg-white/6 dark:border-white/15 dark:text-white/90 dark:focus:border-primary/50"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setRenameOpen(false)}
                className="rounded-md px-4 py-2 text-xs font-medium transition-colors border border-border text-muted-foreground hover:text-foreground hover:bg-accent dark:border-white/10 dark:text-white/40 dark:hover:text-white/80 dark:hover:border-white/20 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameSave}
                disabled={saving || !renameValue.trim()}
                className="rounded-md px-4 py-2 text-xs font-bold text-white disabled:opacity-50 transition-opacity hover:opacity-90 bg-gradient-primary"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete modal */}
      {confirmOpen && query && (
        <ConfirmModal
          title="Delete Query"
          message={`Are you sure you want to delete "${query.queryName}"? This cannot be undone.`}
          loading={deleting}
          onConfirm={handleDelete}
          onClose={() => setConfirmOpen(false)}
        />
      )}

      {/* Edit slot modal */}
      {editSlotIdx !== null && query.players[editSlotIdx] && (
        <EditSlotModal
          player={query.players[editSlotIdx]}
          saving={saving}
          onSave={(updated) => handleSlotSave(editSlotIdx, updated)}
          onClose={() => setEditSlotIdx(null)}
        />
      )}

      {/* Content */}
      <div className="space-y-4 w-full">

        {/* Player slot grid */}
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${query.players.length}, minmax(0, 1fr))` }}
        >
          {query.players.map((player, i) => (
            <PlayerSlotCard
              key={i}
              player={player}
              nameToId={nameToId}
              onClick={() => setEditSlotIdx(i)}
            />
          ))}
        </div>

        {/* Action buttons */}
        {runError && <p className="text-xs text-destructive text-center">{runError}</p>}
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={handleRun}
            disabled={running}
            className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-white disabled:opacity-50 transition-all hover:opacity-90 hover:shadow-[0_0_14px_rgba(139,92,246,0.4)] active:scale-95 bg-gradient-primary"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Run again
          </button>

          <button
            onClick={handleLoad}
            className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-colors border border-border text-foreground hover:bg-accent dark:border-white/15 dark:text-white/75 dark:hover:bg-white/5"
          >
            <Users className="h-4 w-4" />
            Load into Team Generator
          </button>
        </div>

        {/* Last results */}
        {effectiveResult && (
          <div className="rounded-xl p-5 space-y-3 bg-card border border-border dark:bg-white/3 dark:border-white/7">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              Last Results
              <span className="ml-2 font-normal normal-case tracking-normal text-muted-foreground dark:text-white/35">
                {effectiveResult.comps.length} comp{effectiveResult.comps.length !== 1 ? "s" : ""}
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              {effectiveResult.comps.map((c, i) => {
                const cfg = archetypeCfg(c.archetype);
                return (
                  <span
                    key={i}
                    className={`${oxanium.className} inline-flex items-center rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-widest`}
                    style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                  >
                    {c.archetype}
                  </span>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
