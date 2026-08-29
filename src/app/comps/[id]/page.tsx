"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Oxanium } from "next/font/google";
import PowerSpikeSegment from "@/components/PowerSpikeSegment";
import EngageMeter from "@/components/EngageMeter";
import ConfirmModal from "@/components/ConfirmModal";
import {
  useGetChampionsQuery,
  useGetCompsQuery,
  useUpdateCompMutation,
  useDeleteCompMutation,
  type GeneratedComp,
} from "@/state/api";
import {
  AlertTriangle,
  Edit2,
  Loader2,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";

const oxanium = Oxanium({ subsets: ["latin"], weight: ["600", "700", "800"] });

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

const DDRAG_ICON = (id: string) =>
  `https://ddragon.leagueoflegends.com/cdn/16.16.1/img/champion/${id}.png`;
const DDRAG_LOADING = (id: string) =>
  `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${id}_0.jpg`;

const CDRAG_POS =
  "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions";
const ROLE_POS: Record<string, string> = {
  top: "top", jungle: "jungle", mid: "middle", adc: "bottom", support: "utility",
};
const roleIconUrl = (role: string) =>
  `${CDRAG_POS}/icon-position-${ROLE_POS[role] ?? role}.png`;

const ROLE_COLORS: Record<string, string> = {
  top: "239,68,68", jungle: "34,197,94", mid: "139,92,246",
  adc: "245,158,11", support: "59,130,246",
};

const ARCHETYPE_CFG: Record<string, { color: string; bg: string; border: string }> = {
  "Teamfight":    { color: "#60A5FA", bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.3)"  },
  "Poke / Siege": { color: "#FBBF24", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.3)"  },
  "Pick Comp":    { color: "#F87171", bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.3)"   },
  "Split Push":   { color: "#34D399", bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.3)"  },
  "Early Game":   { color: "#FB923C", bg: "rgba(249,115,22,0.12)",  border: "rgba(249,115,22,0.3)"  },
};
const DEFAULT_CFG = {
  color: "#A78BFA", bg: "rgba(139,92,246,0.12)", border: "rgba(139,92,246,0.3)",
};
const archetypeCfg = (a: string) => ARCHETYPE_CFG[a] ?? DEFAULT_CFG;

const synergyColor = (s: number) =>
  s >= 7.5 ? "#A78BFA" : s >= 5 ? "#818CF8" : "#7DD3FC";

const difficultyColor = (d: number) =>
  d <= 3 ? "#34D399" : d <= 6 ? "#FACC15" : "#F87171";

const ROLES = ["top", "jungle", "mid", "adc", "support"] as const;

// ── Synergy pairs ─────────────────────────────────────────────────────────

function SynergyPairs({ comp, nameToId }: { comp: GeneratedComp; nameToId: Record<string, string> }) {
  const pairs = [...(comp.analysis.synergies.pairs ?? [])]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (pairs.length === 0) {
    return (
      <p className="text-xs text-muted-foreground dark:text-white/30">
        No synergy data available.
      </p>
    );
  }

  return (
    <div className="space-y-3 w-full">
      {pairs.map((pair, i) => {
        const [c1, c2] = pair.champions;
        const id1 = nameToId[c1], id2 = nameToId[c2];
        const pct = Math.min(Math.round((pair.score / 10) * 100), 100);

        return (
          <div key={i} className="flex items-center gap-3">
            <div className="flex shrink-0 items-center">
              <div className="h-9 w-9 rounded-md overflow-hidden border-2 border-primary/40 bg-black/6 dark:bg-white/6">
                {id1 && <img src={DDRAG_ICON(id1)} alt={c1} className="h-full w-full object-cover" />}
              </div>
              <div className="h-9 w-9 rounded-md overflow-hidden -ml-2 border-2 border-primary/40 bg-black/6 dark:bg-white/6">
                {id2 && <img src={DDRAG_ICON(id2)} alt={c2} className="h-full w-full object-cover" />}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold leading-tight truncate text-foreground dark:text-white/80">
                {c1} + {c2}
              </p>
              <div className="mt-1 h-1 w-full rounded-full overflow-hidden bg-black/8 dark:bg-white/7">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-gradient-primary"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            <span className="text-xs font-bold tabular-nums shrink-0 text-primary">
              {pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function CompDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data: compsData, isLoading } = useGetCompsQuery();
  const { data: champData } = useGetChampionsQuery();
  const [updateComp, { isLoading: saving }] = useUpdateCompMutation();
  const [deleteComp, { isLoading: deleting }] = useDeleteCompMutation();

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const nameToId = useMemo(
    () =>
      Object.entries(champData?.data ?? {}).reduce(
        (acc: Record<string, string>, [champId, data]) => { acc[data.name] = champId; return acc; },
        {}
      ),
    [champData]
  );

  const savedComp = compsData?.comps.find((c) => c.compId === id);

  const [rerollIdx, setRerollIdx] = useState([0, 0, 0, 0, 0]);
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);

  const handleDelete = async () => {
    if (!savedComp) return;
    await deleteComp(savedComp.compId);
    router.push("/comps");
  };

  const handleRenameOpen = () => {
    setRenameValue(savedComp?.compName ?? "");
    setRenameOpen(true);
  };

  const handleRenameSave = async () => {
    if (!savedComp || !renameValue.trim()) return;
    await updateComp({ compId: savedComp.compId, compName: renameValue.trim() });
    setRenameOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm py-12 justify-center text-muted-foreground dark:text-white/40">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  if (!savedComp) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertTriangle className="h-8 w-8 text-muted-foreground/40 dark:text-white/15" />
        <p className="text-sm text-muted-foreground dark:text-white/35">Comp not found.</p>
        <Link href="/comps" className="text-xs text-primary hover:underline">
          Back to saved comps
        </Link>
      </div>
    );
  }

  const comp = savedComp.comp;
  const archCfg = archetypeCfg(comp.archetype);
  const overallScore = comp.overallScore;
  const synColor = synergyColor(comp.analysis.synergies.overall);
  const difColor = difficultyColor(comp.analysis.difficulty);

  return (
    <div className="space-y-4">

      {/* Comp name + date */}
      <div className="space-y-1">
        <div className="flex items-start gap-2">
          <h1 className={`${oxanium.className} text-4xl sm:text-5xl font-extrabold uppercase leading-none tracking-tight flex-1 min-w-0 text-foreground dark:text-white/90`}>
            {savedComp.compName}
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
          Saved {fmt(savedComp.savedAt)}
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
                Rename Comp
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
      {confirmOpen && savedComp && (
        <ConfirmModal
          title="Delete Comp"
          message={`Are you sure you want to delete "${savedComp.compName}"? This cannot be undone.`}
          loading={deleting}
          onConfirm={handleDelete}
          onClose={() => setConfirmOpen(false)}
        />
      )}

      {/* Content */}
      <div className="max-w-6xl mx-auto w-full">

        {/* ── Full expanded card ── */}
        <div className="rounded-xl overflow-hidden bg-card border border-border shadow-sm dark:bg-white/3 dark:border-white/7 dark:shadow-none">
          {/* Top accent bar */}
          <div className="h-0.5 bg-gradient-primary" />

          {/* Header row */}
          <div className="flex items-center gap-3 px-5 pt-4 pb-3 flex-wrap">
            <span
              className={`${oxanium.className} inline-flex items-center rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-widest shrink-0`}
              style={{ background: archCfg.bg, color: archCfg.color, border: `1px solid ${archCfg.border}` }}
            >
              {comp.archetype}
            </span>
            <PowerSpikeSegment spike={comp.analysis.powerSpike} />
            <EngageMeter engage={comp.analysis.engage} />
          </div>

          {/* Score bar */}
          <div className="px-5 pb-3">
            <div className="flex items-center gap-3 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-white/30">
                Overall Score
              </span>
              <span className="text-xl font-black tabular-nums leading-none text-primary">
                {overallScore}%
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full overflow-hidden bg-muted dark:bg-white/7">
              <div
                className="h-full rounded-full transition-all duration-700 bg-gradient-primary"
                style={{ width: `${overallScore}%` }}
              />
            </div>
          </div>

          {/* Description */}
          <p className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground dark:text-white/50">
            {comp.description}
          </p>

          {/* Divider */}
          <div className="mx-5 h-px bg-border dark:bg-white/6" />

          {/* Champion banners */}
          <div className="grid grid-cols-5 gap-2 px-4 pt-3 pb-4">
            {ROLES.map((role, rIdx) => {
              const pick = comp.picks.find((p) => p.role === role);
              const suggIdx = rerollIdx[rIdx];
              const sugg = pick?.suggestions?.[suggIdx];
              const champId = sugg?.champion ? nameToId[sugg.champion] : undefined;
              const canReroll = (pick?.suggestions?.length ?? 0) > 1;
              const isHovered = hoveredSlot === rIdx;
              const roleRgb = ROLE_COLORS[role] ?? "255,255,255";

              return (
                <div key={role} className="flex flex-col items-center gap-2">
                  <div
                    className="relative w-full"
                    onMouseEnter={() => setHoveredSlot(rIdx)}
                    onMouseLeave={() => setHoveredSlot(null)}
                    style={{
                      aspectRatio: "2/3",
                      transition: "filter 0.45s ease",
                      filter: sugg
                        ? isHovered
                          ? `drop-shadow(0 0 5px rgba(${roleRgb},0.95)) drop-shadow(0 0 18px rgba(${roleRgb},0.55))`
                          : `drop-shadow(0 0 2px rgba(${roleRgb},0.8)) drop-shadow(0 0 10px rgba(${roleRgb},0.3))`
                        : `drop-shadow(0 0 1px rgba(255,255,255,0.1))`,
                    }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        clipPath: "polygon(0 0, 100% 0, 100% 86%, 50% 100%, 0 86%)",
                        background: "var(--banner-bg)",
                      }}
                    >
                      {champId && (
                        <img
                          src={DDRAG_LOADING(champId)}
                          alt={sugg?.champion}
                          className="absolute inset-0 h-full w-full object-cover object-top"
                          style={{
                            transform: isHovered ? "scale(1.07)" : "scale(1)",
                            transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                          }}
                        />
                      )}
                      <div
                        className="absolute inset-x-0 top-0"
                        style={{ height: "32%", background: "linear-gradient(to bottom, var(--banner-bg) 0%, transparent 100%)" }}
                      />
                      <div
                        className="absolute inset-x-0 bottom-0"
                        style={{ height: "52%", background: "linear-gradient(to top, var(--banner-bg) 0%, var(--banner-bg) 18%, transparent 100%)" }}
                      />
                      <div className="absolute inset-y-0 left-0 w-px" style={{ background: `rgba(${roleRgb}, 0.75)` }} />
                      <div className="absolute inset-y-0 right-0 w-px" style={{ background: `rgba(${roleRgb}, 0.75)` }} />

                      <div className="absolute top-2 inset-x-0 flex justify-center">
                        <div
                          className="flex items-center justify-center rounded-full h-8 w-8"
                          style={{
                            background: `rgba(${roleRgb}, 0.2)`,
                            border: `1.5px solid rgba(${roleRgb}, 0.55)`,
                            boxShadow: `0 0 8px rgba(${roleRgb}, 0.25)`,
                          }}
                        >
                          <img
                            src={roleIconUrl(role)}
                            alt={role}
                            className="h-5 w-5"
                            style={{ filter: "grayscale(1) brightness(4)", opacity: 0.9 }}
                          />
                        </div>
                      </div>
                      {suggIdx > 0 && (
                        <div
                          className="absolute top-2 right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold"
                          style={{ background: "rgba(0,0,0,0.75)", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.2)" }}
                        >
                          {suggIdx + 1}
                        </div>
                      )}
                      <div className="absolute inset-x-0 text-center" style={{ bottom: "17%", padding: "0 6px" }}>
                        <div className="text-[9px] font-semibold uppercase tracking-widest truncate mb-0.5 text-white/45">
                          {sugg?.champion ?? "—"}
                        </div>
                        <div
                          className="text-[11px] font-bold uppercase tracking-wide truncate text-white/90"
                          style={{ textShadow: "var(--banner-text-shadow)" }}
                        >
                          {pick?.player ?? "Fill"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {canReroll ? (
                    <button
                      onClick={() =>
                        setRerollIdx((prev) => {
                          const n = [...prev];
                          n[rIdx] = (n[rIdx] + 1) % (pick?.suggestions.length ?? 1);
                          return n;
                        })
                      }
                      className="flex h-6 w-6 items-center justify-center rounded-full transition-all hover:scale-110 bg-amber-500/15 border border-amber-500/40 text-amber-500 hover:bg-amber-500/30"
                      title="Try next pick"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </button>
                  ) : (
                    <div className="h-6" />
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Expanded section ── */}
          <div className="mx-5 h-px bg-border dark:bg-white/6" />
          <div className="p-5 space-y-4">

            {/* Synergy + Difficulty bars */}
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  label: "Synergy",
                  value: comp.analysis.synergies.overall,
                  pct: comp.analysis.synergies.overall * 10,
                  color: synColor,
                  barGradient: "linear-gradient(90deg, #7DD3FC 0%, #818CF8 50%, #7C3AED 100%)",
                  barGlow: "rgba(129,140,248,0.55)",
                },
                {
                  label: "Difficulty",
                  value: comp.analysis.difficulty,
                  pct: comp.analysis.difficulty * 10,
                  color: difColor,
                  barGradient: null as string | null,
                  barGlow: null as string | null,
                },
              ].map(({ label, value, pct, color, barGradient, barGlow }) => (
                <div key={label} className="rounded-lg p-4 border border-primary/30 dark:bg-white/3">
                  <div className="flex items-center justify-between mb-2.5">
                    <p className="text-xs font-bold uppercase tracking-widest text-primary">{label}</p>
                    <span className="text-sm font-black tabular-nums" style={{ color }}>
                      {value.toFixed(1)}
                      <span className="text-[10px] font-normal" style={{ opacity: 0.55 }}>/10</span>
                    </span>
                  </div>
                  <div className="h-4 w-full rounded-full overflow-hidden bg-black/8 dark:bg-white/6">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: barGradient ?? `linear-gradient(90deg, ${color}88, ${color})`,
                        boxShadow: `0 0 10px ${barGlow ?? color + "55"}`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Win Conditions + Playstyle | Champion Synergies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="space-y-3">
                <div className="rounded-lg p-4 border border-primary/30 dark:bg-white/3">
                  <p className="text-xs font-bold uppercase tracking-widest mb-3 text-primary">
                    Win Conditions
                  </p>
                  <ul className="space-y-1.5">
                    {comp.analysis.winConditions.map((wc, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <span className="shrink-0 font-bold leading-5 text-primary">·</span>
                        <span className="text-foreground dark:text-white/70">{wc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg p-4 border border-primary/30 dark:bg-white/3">
                  <p className="text-xs font-bold uppercase tracking-widest mb-3 text-primary">
                    Suggested Playstyle
                  </p>
                  <p className="text-sm italic text-muted-foreground dark:text-white/55">
                    {comp.analysis.suggestedPlaystyle}
                  </p>
                </div>
              </div>

              <div className="rounded-lg p-4 border border-primary/30 dark:bg-white/3">
                <p className="text-xs font-bold uppercase tracking-widest mb-4 text-primary">
                  Champion Synergies
                </p>
                <SynergyPairs comp={comp} nameToId={nameToId} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
