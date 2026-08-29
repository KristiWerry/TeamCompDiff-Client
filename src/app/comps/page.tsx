"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Oxanium } from "next/font/google";
import PowerSpikeSegment from "@/components/PowerSpikeSegment";
import EngageMeter from "@/components/EngageMeter";
import ConfirmModal from "@/components/ConfirmModal";
import {
  useGetChampionsQuery,
  useGetCompsQuery,
  useDeleteCompMutation,
  type SavedComp,
} from "@/state/api";
import { BookmarkX, Eye, Loader2, Trash2 } from "lucide-react";

const oxanium = Oxanium({ subsets: ["latin"], weight: ["600", "700", "800"] });

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

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

const ARCHETYPE_CFG: Record<string, { color: string; bg: string; border: string; bar: string }> = {
  "Teamfight":    { color: "#60A5FA", bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.3)",  bar: "linear-gradient(90deg,#3B82F6,#60A5FA)" },
  "Poke / Siege": { color: "#FBBF24", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.3)",  bar: "linear-gradient(90deg,#F59E0B,#FBBF24)" },
  "Pick Comp":    { color: "#F87171", bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.3)",   bar: "linear-gradient(90deg,#EF4444,#F87171)" },
  "Split Push":   { color: "#34D399", bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.3)",  bar: "linear-gradient(90deg,#10B981,#34D399)" },
  "Early Game":   { color: "#FB923C", bg: "rgba(249,115,22,0.12)",  border: "rgba(249,115,22,0.3)",  bar: "linear-gradient(90deg,#F97316,#FB923C)" },
};
const DEFAULT_CFG = {
  color: "#A78BFA", bg: "rgba(139,92,246,0.12)", border: "rgba(139,92,246,0.3)",
  bar: "linear-gradient(90deg,#8B5CF6,#A78BFA)",
};
const archetypeCfg = (a: string) => ARCHETYPE_CFG[a] ?? DEFAULT_CFG;

const ROLES = ["top", "jungle", "mid", "adc", "support"] as const;

// ── Saved comp card ───────────────────────────────────────────────────────

function CompCard({ comp, nameToId, onDelete }: {
  comp: SavedComp;
  nameToId: Record<string, string>;
  onDelete: () => void;
}) {
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const cfg = archetypeCfg(comp.comp.archetype);
  const overallScore = comp.comp.overallScore;

  return (
    <div className="rounded-xl overflow-hidden bg-card border border-border shadow-sm dark:bg-white/3 dark:border-white/7 dark:shadow-none">
      {/* Archetype accent bar */}
      <div className="h-0.5 bg-gradient-primary" />

      {/* Header row */}
      <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`${oxanium.className} inline-flex items-center rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-widest shrink-0`}
            style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
          >
            {comp.comp.archetype}
          </span>
          <PowerSpikeSegment spike={comp.comp.analysis.powerSpike} />
          <EngageMeter engage={comp.comp.analysis.engage} />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/comps/${comp.compId}`}
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white transition-all hover:opacity-90 hover:shadow-[0_0_14px_rgba(139,92,246,0.4)] active:scale-95 bg-gradient-primary"
          >
            <Eye className="h-3 w-3" />
            View
          </Link>
          <button
            onClick={() => setConfirmOpen(true)}
            className="flex h-7 w-7 items-center justify-center rounded-full transition-colors bg-muted text-muted-foreground hover:text-destructive hover:bg-destructive/10 dark:bg-white/6 dark:text-white/40 dark:hover:bg-red-500/12 dark:hover:text-red-400"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
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
        {comp.comp.description}
      </p>

      {/* Divider */}
      <div className="mx-5 h-px bg-border dark:bg-white/6" />

      {/* Champion banners */}
      <div className="grid grid-cols-5 gap-2 px-4 pt-3 pb-4">
        {ROLES.map((role, rIdx) => {
          const pick = comp.comp.picks.find((p) => p.role === role);
          const sugg = pick?.suggestions?.[0];
          const champId = sugg?.champion ? nameToId[sugg.champion] : undefined;
          const isHovered = hoveredSlot === rIdx;
          const roleRgb = ROLE_COLORS[role] ?? "255,255,255";

          return (
            <div key={role} className="flex flex-col items-center">
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
                        background: `rgba(${ROLE_COLORS[role] ?? "255,255,255"}, 0.2)`,
                        border: `1.5px solid rgba(${ROLE_COLORS[role] ?? "255,255,255"}, 0.55)`,
                        boxShadow: `0 0 8px rgba(${ROLE_COLORS[role] ?? "255,255,255"}, 0.25)`,
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
            </div>
          );
        })}
      </div>

      {/* Saved date footer */}
      <div className="px-5 pb-3 text-[10px] text-muted-foreground/60 dark:text-white/20">
        Saved {fmt(comp.savedAt)}
      </div>

      {confirmOpen && (
        <ConfirmModal
          title="Delete Comp"
          message={`Are you sure you want to delete "${comp.compName}"? This cannot be undone.`}
          onConfirm={() => { setConfirmOpen(false); onDelete(); }}
          onClose={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function CompsPage() {
  const { data: champData } = useGetChampionsQuery();
  const nameToId = useMemo(
    () =>
      Object.entries(champData?.data ?? {}).reduce(
        (acc: Record<string, string>, [id, data]) => { acc[data.name] = id; return acc; },
        {}
      ),
    [champData]
  );

  const { data: compsData, isLoading: compsLoading } = useGetCompsQuery();
  const [deleteComp] = useDeleteCompMutation();

  const comps = compsData?.comps ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <h1 className={`${oxanium.className} text-4xl sm:text-5xl font-extrabold uppercase leading-none tracking-tight text-foreground dark:text-white/90`}>
          Team Comps
        </h1>
        <div className="h-px w-full bg-linear-to-r from-primary/70 via-teal-500/30 to-transparent" />
      </div>

      {compsLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-white/40">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : comps.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border dark:border-white/10 py-16 text-center">
          <BookmarkX className="h-8 w-8 mb-3 text-muted-foreground/40 dark:text-white/15" />
          <p className="text-sm font-medium text-foreground dark:text-white/60">
            No saved comps yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground dark:text-white/30">
            Run the algorithm on Team Generator and save a comp you like.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {comps.map((comp) => (
            <CompCard
              key={comp.compId}
              comp={comp}
              nameToId={nameToId}
              onDelete={() => deleteComp(comp.compId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
