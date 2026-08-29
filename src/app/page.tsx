"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Oxanium } from "next/font/google";
import { useAppDispatch, useAppSelector } from "@/app/redux";
import { setChampions, initMatchesFromCache, loadQueryPlayers } from "@/state/teamSlice";
import { getCachedMatches } from "@/lib/matchCache";
import SummonerCard from "@/components/Team/SummonerCard";
import PowerSpikeSegment from "@/components/PowerSpikeSegment";
import EngageMeter from "@/components/EngageMeter";
import {
  useGetChampionsQuery,
  useGetQueriesQuery,
  useRunTeamCompMutation,
  useSaveCompMutation,
  useCreateQueryMutation,
  type PlayerInput,
  type GeneratedComp,
  type TeamCompResponse,
  type SavedQuery,
} from "@/state/api";
import type { Role } from "@/lib/riot/types";
import {
  BookmarkPlus,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  Loader2,
  Play,
  RefreshCw,
  Save,
  Swords,
  Target,
  BarChart3,
  X,
} from "lucide-react";

const oxanium = Oxanium({ subsets: ["latin"], weight: ["600", "700", "800"] });

// ── Feature definitions ───────────────────────────────────────────────────

const FEATURES = [
  {
    Icon: Swords,
    colorClass: "text-amber-400",
    barClass: "bg-amber-400",
    borderColor: "rgba(245,158,11,0.35)",
    shadow: "0 8px 32px rgba(245,158,11,0.15)",
    label: "Synergy Check",
    desc: "Analyzes role balance, damage spread, and team-fight control to ensure your picks work together.",
  },
  {
    Icon: Target,
    colorClass: "text-violet-400",
    barClass: "bg-violet-400",
    borderColor: "rgba(139,92,246,0.45)",
    shadow: "0 8px 32px rgba(139,92,246,0.2)",
    label: "Pool Matching",
    desc: "Matches champion suggestions to player mastery, win rate data, and preferred picks.",
  },
  {
    Icon: BarChart3,
    colorClass: "text-teal-400",
    barClass: "bg-teal-400",
    borderColor: "rgba(20,184,166,0.35)",
    shadow: "0 8px 32px rgba(20,184,166,0.15)",
    label: "Win Conditions",
    desc: "Identifies power spikes, engage potential, and play styles suited to your team's strengths.",
  },
];

// ── Comp card helpers ─────────────────────────────────────────────────────

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
  top: "239,68,68",
  jungle: "34,197,94",
  mid: "139,92,246",
  adc: "245,158,11",
  support: "59,130,246",
};

const ARCHETYPE_CFG: Record<string, { color: string; bg: string; border: string; bar: string }> = {
  "Teamfight": { color: "#60A5FA", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)", bar: "linear-gradient(90deg,#3B82F6,#60A5FA)" },
  "Poke / Siege": { color: "#FBBF24", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)", bar: "linear-gradient(90deg,#F59E0B,#FBBF24)" },
  "Pick Comp": { color: "#F87171", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)", bar: "linear-gradient(90deg,#EF4444,#F87171)" },
  "Split Push": { color: "#34D399", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)", bar: "linear-gradient(90deg,#10B981,#34D399)" },
  "Early Game": { color: "#FB923C", bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.3)", bar: "linear-gradient(90deg,#F97316,#FB923C)" },
};
const DEFAULT_CFG = {
  color: "#A78BFA", bg: "rgba(139,92,246,0.12)", border: "rgba(139,92,246,0.3)", bar: "linear-gradient(90deg,#8B5CF6,#A78BFA)",
};
const archetypeCfg = (a: string) => ARCHETYPE_CFG[a] ?? DEFAULT_CFG;



// Synergy: higher = better. Matches bar gradient: light blue → indigo → violet.
const synergyPill = (s: number) =>
  s >= 7.5 ? { bg: "rgba(124,58,237,0.15)", color: "#A78BFA" }  // violet  — excellent
    : s >= 5 ? { bg: "rgba(129,140,248,0.15)", color: "#818CF8" }  // indigo  — decent
      : { bg: "rgba(125,211,252,0.15)", color: "#7DD3FC" };  // sky     — weak

// Difficulty: lower = easier = better. Green → yellow → red palette.
const difficultyPill = (d: number) =>
  d <= 3 ? { bg: "rgba(52,211,153,0.15)", color: "#34D399" }  // green  — easy
    : d <= 6 ? { bg: "rgba(250,204,21,0.15)", color: "#FACC15" }  // yellow — moderate
      : { bg: "rgba(248,113,113,0.15)", color: "#F87171" }; // red    — hard

// ── NameModal ─────────────────────────────────────────────────────────────

function NameModal({
  title,
  placeholder,
  confirmLabel = "Save",
  onConfirm,
  onCancel,
  loading = false,
  dm,
}: {
  title: string;
  placeholder: string;
  confirmLabel?: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
  loading?: boolean;
  dm: boolean;
}) {
  const [value, setValue] = useState("");

  const handleConfirm = () => {
    if (!value.trim()) return;
    onConfirm(value.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onCancel(); }}
    >
      <div
        className={`w-full max-w-sm mx-4 rounded-2xl p-6 shadow-2xl ${dm ? "" : "bg-card border border-border"}`}
        style={dm ? {
          background: "#0d0d14",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.7)",
        } : undefined}
      >
        <h3
          className={`text-base font-bold mb-1 ${dm ? "" : "text-foreground"}`}
          style={dm ? { color: "rgba(255,255,255,0.92)" } : undefined}
        >
          {title}
        </h3>
        <p
          className={`text-xs mb-4 ${dm ? "" : "text-muted-foreground"}`}
          style={dm ? { color: "rgba(255,255,255,0.4)" } : undefined}
        >
          Give it a name you&apos;ll recognise later.
        </p>
        <input
          autoFocus
          type="text"
          placeholder={placeholder}
          value={value}
          disabled={loading}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleConfirm();
            if (e.key === "Escape" && !loading) onCancel();
          }}
          className={`w-full rounded-lg px-3 py-2.5 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 ${dm ? "" : "bg-background border border-input text-foreground"}`}
          style={dm ? {
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.9)",
          } : undefined}
        />
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 border border-border text-muted-foreground hover:text-foreground hover:border-border/80 dark:border-white/10 dark:text-white/40 dark:hover:border-white/25 dark:hover:text-white/75"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !value.trim()}
            className="rounded-lg px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, rgba(139,92,246,1) 0%, rgba(99,60,220,1) 100%)" }}
          >
            {loading ? "Saving…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Synergy pair bars ─────────────────────────────────────────────────────

function SynergyPairs({
  comp,
  nameToId,
  dm,
  color,
}: {
  comp: GeneratedComp;
  nameToId: Record<string, string>;
  dm: boolean;
  color: string;
}) {
  const pairs = [...(comp.analysis.synergies.pairs ?? [])]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (pairs.length === 0) {
    return (
      <p className="text-xs" style={{ color: dm ? "rgba(255,255,255,0.3)" : undefined }}>
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
            {/* Overlapping champion square icons */}
            <div className="flex shrink-0 items-center">
              <div
                className="h-9 w-9 rounded-md overflow-hidden"
                style={{ border: `2px solid ${color}66`, background: dm ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}
              >
                {id1 && <img src={DDRAG_ICON(id1)} alt={c1} className="h-full w-full object-cover" />}
              </div>
              <div
                className="h-9 w-9 rounded-md overflow-hidden -ml-2"
                style={{ border: `2px solid ${color}66`, background: dm ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}
              >
                {id2 && <img src={DDRAG_ICON(id2)} alt={c2} className="h-full w-full object-cover" />}
              </div>
            </div>

            {/* Names + score bar */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold leading-tight truncate" style={{ color: dm ? "rgba(255,255,255,0.8)" : undefined }}>
                {c1} + {c2}
              </p>
              <div
                className="mt-1 h-1 w-full rounded-full overflow-hidden"
                style={{ background: dm ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
            </div>

            <span className="text-xs font-bold tabular-nums shrink-0" style={{ color }}>
              {pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── StatPill ──────────────────────────────────────────────────────────────

function StatPill({ bg, color, children }: { bg: string; color: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
      style={{ background: bg, color }}
    >
      {children}
    </span>
  );
}

// ── LoadQueryModal ────────────────────────────────────────────────────────

function LoadQueryModal({
  dm,
  onLoad,
  onClose,
}: {
  dm: boolean;
  onLoad: (players: PlayerInput[]) => void;
  onClose: () => void;
}) {
  const { data, isLoading } = useGetQueriesQuery();
  const queries: SavedQuery[] = data?.queries ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden ${dm ? "" : "bg-card border border-border"}`}
        style={dm ? { background: "#0d0d14", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 60px rgba(0,0,0,0.7)" } : undefined}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 ${dm ? "" : "border-b border-border"}`}
          style={dm ? { borderBottom: "1px solid rgba(255,255,255,0.07)" } : undefined}
        >
          <div>
            <h3
              className={`text-base font-bold ${dm ? "" : "text-foreground"}`}
              style={dm ? { color: "rgba(255,255,255,0.92)" } : undefined}
            >
              Load Query
            </h3>
            <p
              className={`text-xs mt-0.5 ${dm ? "" : "text-muted-foreground"}`}
              style={dm ? { color: "rgba(255,255,255,0.38)" } : undefined}
            >
              Select a query to populate the slots
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors dark:hover:bg-white/10 hover:bg-accent"
            style={dm ? { color: "rgba(255,255,255,0.4)" } : undefined}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 max-h-112 overflow-y-auto space-y-2">
          {isLoading ? (
            <div
              className={`flex items-center justify-center gap-2 py-10 text-sm ${dm ? "" : "text-muted-foreground"}`}
              style={dm ? { color: "rgba(255,255,255,0.4)" } : undefined}
            >
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : queries.length === 0 ? (
            <p
              className={`text-center text-sm py-10 italic ${dm ? "" : "text-muted-foreground"}`}
              style={dm ? { color: "rgba(255,255,255,0.35)" } : undefined}
            >
              No saved queries yet. Save one from the main page first.
            </p>
          ) : (
            queries.map((q) => (
              <button
                key={q.queryId}
                onClick={() => { onLoad(q.players); onClose(); }}
                className={`w-full text-left rounded-xl p-4 transition-all ${dm ? "" : "bg-muted hover:bg-accent"}`}
                style={dm ? { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" } : undefined}
                onMouseEnter={dm ? (e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; } : undefined}
                onMouseLeave={dm ? (e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; } : undefined}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span
                    className={`font-semibold text-sm leading-tight ${dm ? "" : "text-foreground"}`}
                    style={dm ? { color: "rgba(255,255,255,0.9)" } : undefined}
                  >
                    {q.queryName}
                  </span>
                  <span
                    className={`text-[10px] shrink-0 ${dm ? "" : "text-muted-foreground"}`}
                    style={dm ? { color: "rgba(255,255,255,0.32)" } : undefined}
                  >
                    {q.lastRunAt ? `Run ${new Date(q.lastRunAt).toLocaleDateString()}` : "Never run"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {q.players.map((p, i) => {
                    const color = ROLE_COLORS[p.primaryRole] ?? "255,255,255";
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-center rounded-full h-7 w-7"
                        style={{
                          background: `rgba(${color}, 0.15)`,
                          border: `1px solid rgba(${color}, 0.35)`,
                        }}
                      >
                        <img
                          src={roleIconUrl(p.primaryRole)}
                          alt={p.primaryRole}
                          className="h-4 w-4"
                          style={{ filter: "grayscale(1) brightness(4)", opacity: 0.85 }}
                        />
                      </div>
                    );
                  })}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── CompCard ──────────────────────────────────────────────────────────────

const ROLES = ["top", "jungle", "mid", "adc", "support"] as const;

function CompCard({
  comp,
  onSave,
  nameToId,
  dm,
}: {
  comp: GeneratedComp;
  onSave: (comp: GeneratedComp, name: string) => Promise<void>;
  nameToId: Record<string, string>;
  dm: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [rerollIdx, setRerollIdx] = useState([0, 0, 0, 0, 0]);
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);

  const cfg = archetypeCfg(comp.archetype);
  const overallScore = comp.overallScore;

  const handleSave = async (name: string) => {
    setIsSaving(true);
    await onSave(comp, name || `${comp.archetype} Comp`);
    setIsSaving(false);
    setSaving(false);
  };

  const divStyle = dm ? { background: "rgba(255,255,255,0.06)" } : undefined;

  return (
    <div
      className={`rounded-xl overflow-hidden ${dm ? "" : "bg-card border border-border shadow-sm"}`}
      style={dm ? { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" } : undefined}
    >
      {/* Archetype accent bar */}
      <div className="h-0.5" style={{ background: cfg.bar }} />

      {/* Header row: archetype + stat tags + save + expand */}
      <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`${oxanium.className} inline-flex items-center rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-widest shrink-0`}
            style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
          >
            {comp.archetype}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setSaving((p) => !p)}
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white transition-all hover:opacity-90 hover:shadow-[0_0_14px_rgba(139,92,246,0.4)] active:scale-95"
            style={{ background: "linear-gradient(135deg, rgba(139,92,246,1) 0%, rgba(99,60,220,1) 100%)" }}
          >
            <BookmarkPlus className="h-3 w-3" />
            Save
          </button>
          <button
            onClick={() => setExpanded((p) => !p)}
            className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors
              ${dm ? "" : "bg-muted hover:bg-accent text-muted-foreground hover:text-foreground"}`}
            style={dm ? { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" } : undefined}
            onMouseEnter={dm ? (e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.75)"; } : undefined}
            onMouseLeave={dm ? (e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; } : undefined}
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Save comp modal */}
      {saving && (
        <NameModal
          title="Save Comp"
          placeholder={`${comp.archetype} Comp`}
          confirmLabel="Save"
          onConfirm={handleSave}
          onCancel={() => setSaving(false)}
          loading={isSaving}
          dm={dm}
        />
      )}

      {/* Score bar */}
      <div className="px-5 pb-3">
        <div className="flex items-center gap-3 mb-1.5">
          <span
            className={`text-[10px] font-bold uppercase tracking-widest ${dm ? "" : "text-muted-foreground"}`}
            style={dm ? { color: "rgba(255,255,255,0.3)" } : undefined}
          >
            Overall Score
          </span>
          <span className="text-xl font-black tabular-nums leading-none" style={{ color: cfg.color }}>
            {overallScore}%
          </span>
        </div>
        <div
          className={`h-1.5 w-full rounded-full overflow-hidden ${dm ? "" : "bg-muted"}`}
          style={dm ? { background: "rgba(255,255,255,0.07)" } : undefined}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${overallScore}%`, background: cfg.bar }}
          />
        </div>
      </div>

      {/* Power spike + Engage row */}
      <div
        className={`mx-5 mb-4 flex items-start gap-8 rounded-lg px-4 py-3 ${dm ? "" : "bg-muted/40"}`}
        style={dm ? { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" } : undefined}
      >
        <PowerSpikeSegment spike={comp.analysis.powerSpike} size="lg" />
        <div className="w-px self-stretch bg-black/8 dark:bg-white/7" />
        <EngageMeter engage={comp.analysis.engage} size="lg" />
      </div>

      {/* Description */}
      <p
        className={`px-5 pb-4 text-sm leading-relaxed ${dm ? "" : "text-muted-foreground"}`}
        style={dm ? { color: "rgba(255,255,255,0.5)" } : undefined}
      >
        {comp.description}
      </p>

      {/* Divider */}
      <div className={`mx-5 h-px ${dm ? "" : "bg-border"}`} style={divStyle} />

      {/* Champion banner row */}
      <div className="grid grid-cols-5 gap-2 px-4 pt-3 pb-4">
        {ROLES.map((role, rIdx) => {
          const pick = comp.picks.find((p) => p.role === role);
          const suggIdx = rerollIdx[rIdx];
          const sugg = pick?.suggestions?.[suggIdx];
          const champId = sugg?.champion ? nameToId[sugg.champion] : undefined;
          const canReroll = (pick?.suggestions?.length ?? 0) > 1;
          const isHovered = hoveredSlot === rIdx;

          return (
            <div key={role} className="flex flex-col items-center gap-2">
              {/* Outer wrapper — drop-shadow provides the colored glow border */}
              <div
                className="relative w-full"
                onMouseEnter={() => setHoveredSlot(rIdx)}
                onMouseLeave={() => setHoveredSlot(null)}
                style={{
                  aspectRatio: "2/3",
                  transition: "filter 0.45s ease",
                  filter: sugg
                    ? isHovered
                      ? `drop-shadow(0 0 5px ${cfg.color}) drop-shadow(0 0 18px ${cfg.color}88)`
                      : `drop-shadow(0 0 2px ${cfg.color}) drop-shadow(0 0 10px ${cfg.border})`
                    : `drop-shadow(0 0 1px rgba(255,255,255,0.1))`,
                }}
              >
                {/* Inner banner — clipped to pointed/chevron shape */}
                <div
                  className="absolute inset-0"
                  style={{
                    clipPath: "polygon(0 0, 100% 0, 100% 86%, 50% 100%, 0 86%)",
                    background: "var(--banner-bg)",
                  }}
                >
                  {/* Champion loading screen art */}
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

                  {/* Top fade — art fades into solid background */}
                  <div
                    className="absolute inset-x-0 top-0"
                    style={{
                      height: "32%",
                      background: "linear-gradient(to bottom, var(--banner-bg) 0%, transparent 100%)",
                    }}
                  />

                  {/* Bottom fade — art fades into solid background for text zone */}
                  <div
                    className="absolute inset-x-0 bottom-0"
                    style={{
                      height: "52%",
                      background: "linear-gradient(to top, var(--banner-bg) 0%, var(--banner-bg) 18%, transparent 100%)",
                    }}
                  />

                  {/* Side accent lines */}
                  <div className="absolute inset-y-0 left-0 w-px" style={{ background: cfg.color, opacity: 0.75 }} />
                  <div className="absolute inset-y-0 right-0 w-px" style={{ background: cfg.color, opacity: 0.75 }} />

                  {/* Role icon — top center, colored circle per role */}
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

                  {/* Alt pick badge — top right */}
                  {suggIdx > 0 && (
                    <div
                      className="absolute top-2 right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold"
                      style={{ background: "rgba(0,0,0,0.75)", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.2)" }}
                    >
                      {suggIdx + 1}
                    </div>
                  )}

                  {/* Bottom text — sits in the solid zone above the point */}
                  <div
                    className="absolute inset-x-0 text-center"
                    style={{ bottom: "17%", padding: "0 6px" }}
                  >
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

              {/* Re-roll button — gold, only visible when accordion is open */}
              {expanded && (
                canReroll ? (
                  <button
                    onClick={() =>
                      setRerollIdx((prev) => {
                        const n = [...prev];
                        n[rIdx] = (n[rIdx] + 1) % (pick?.suggestions.length ?? 1);
                        return n;
                      })
                    }
                    className="flex h-6 w-6 items-center justify-center rounded-full transition-all hover:scale-110"
                    style={{
                      background: "rgba(245,158,11,0.15)",
                      border: "1px solid rgba(245,158,11,0.4)",
                      color: "#F59E0B",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(245,158,11,0.3)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(245,158,11,0.15)"; }}
                    title="Try next pick"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </button>
                ) : (
                  <div className="h-6" />
                )
              )}
            </div>
          );
        })}
      </div>

      {/* Expanded section */}
      {expanded && (
        <>
          <div className={`mx-5 h-px ${dm ? "" : "bg-border"}`} style={divStyle} />
          <div className="p-5 space-y-4">

            {/* Synergy + Difficulty bars */}
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  label: "Synergy",
                  value: comp.analysis.synergies.overall,
                  pct: comp.analysis.synergies.overall * 10,
                  barGradient: "linear-gradient(90deg, #7DD3FC 0%, #818CF8 50%, #7C3AED 100%)",
                  barGlow: "rgba(129,140,248,0.55)",
                  ...synergyPill(comp.analysis.synergies.overall),
                },
                {
                  label: "Difficulty",
                  value: comp.analysis.difficulty,
                  pct: comp.analysis.difficulty * 10,
                  barGradient: null,
                  barGlow: null,
                  ...difficultyPill(comp.analysis.difficulty),
                },
              ].map(({ label, value, pct, color, barGradient, barGlow }) => (
                <div
                  key={label}
                  className="rounded-lg p-4"
                  style={{
                    background: dm ? "rgba(255,255,255,0.03)" : undefined,
                    border: `1.5px solid ${cfg.border}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: cfg.color }}>
                      {label}
                    </p>
                    <span className="text-sm font-black tabular-nums" style={{ color }}>
                      {value.toFixed(1)}
                      <span className="text-[10px] font-normal" style={{ opacity: 0.55 }}>/10</span>
                    </span>
                  </div>
                  <div
                    className="h-4 w-full rounded-full overflow-hidden"
                    style={{ background: dm ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)" }}
                  >
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

            {/* 2-column: Win Conditions + Playstyle | Synergy pairs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Left: Win Conditions + Playstyle */}
              <div className="space-y-3">
                <div
                  className="rounded-lg p-4"
                  style={{
                    background: dm ? "rgba(255,255,255,0.03)" : undefined,
                    border: `1.5px solid ${cfg.border}`,
                  }}
                >
                  <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: cfg.color }}>
                    Win Conditions
                  </p>
                  <ul className="space-y-1.5">
                    {comp.analysis.winConditions.map((wc, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <span className="shrink-0 font-bold leading-5" style={{ color: cfg.color }}>·</span>
                        <span className={dm ? "" : "text-foreground"} style={dm ? { color: "rgba(255,255,255,0.7)" } : undefined}>
                          {wc}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div
                  className="rounded-lg p-4"
                  style={{
                    background: dm ? "rgba(255,255,255,0.03)" : undefined,
                    border: `1.5px solid ${cfg.border}`,
                  }}
                >
                  <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: cfg.color }}>
                    Suggested Playstyle
                  </p>
                  <p className="text-sm italic" style={dm ? { color: "rgba(255,255,255,0.55)" } : undefined}>
                    {comp.analysis.suggestedPlaystyle}
                  </p>
                </div>
              </div>

              {/* Right: Champion Synergies */}
              <div
                className="rounded-lg p-4"
                style={{
                  background: dm ? "rgba(255,255,255,0.03)" : undefined,
                  border: `1.5px solid ${cfg.border}`,
                }}
              >
                <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: cfg.color }}>
                  Champion Synergies
                </p>
                <SynergyPairs comp={comp} nameToId={nameToId} dm={dm} color={cfg.color} />
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function TeamPage() {
  const dispatch = useAppDispatch();
  const slots = useAppSelector((s: any) => s.team?.slots ?? []) as any[];
  const isDarkMode = useAppSelector((s: any) => s.global?.isDarkMode ?? false);

  const validSlots = slots.filter((s: any) => s.primaryRole && s.slotChampPool?.length > 0).length;

  const { data: champData } = useGetChampionsQuery();

  const nameToId = useMemo(
    () =>
      Object.entries(champData?.data ?? {}).reduce(
        (acc: Record<string, string>, [id, data]) => { acc[data.name] = id; return acc; },
        {}
      ),
    [champData]
  );

  const [runTeamComp, { isLoading: running }] = useRunTeamCompMutation();
  const [saveComp] = useSaveCompMutation();
  const [createQuery, { isLoading: savingQueryRequest }] = useCreateQueryMutation();
  const [results, setResults]           = useState<TeamCompResponse | null>(null);
  const [runError, setRunError]         = useState("");
  const [savingQuery, setSavingQuery]   = useState(false);
  const [showLoadQuery, setShowLoadQuery] = useState(false);
  const [toast, setToast]               = useState("");
  const [lastSavedSlotsJson, setLastSavedSlotsJson] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3000);
  };

  useEffect(() => {
    if (champData?.data) {
      const mapped = Object.fromEntries(
        Object.entries(champData.data).map(([id, data]) => [
          id,
          { ...data, roles: data.roles.map((r) => (r === "bot" ? "adc" : r)) },
        ])
      );
      dispatch(setChampions(mapped));
    }
  }, [champData, dispatch]);

  useEffect(() => {
    const cached = getCachedMatches();
    if (Object.keys(cached).length > 0) dispatch(initMatchesFromCache(cached));
  }, [dispatch]);

  const buildPlayers = (): PlayerInput[] =>
    slots
      .filter((s: any) => s.primaryRole && s.slotChampPool?.length > 0)
      .map((s: any) => ({
        primaryRole: s.primaryRole as Role,
        secondaryRole: s.secondaryRole as Role | undefined,
        champPool: s.slotChampPool,
        riotId: s.gameName && s.tagLine ? `${s.gameName}#${s.tagLine}` : undefined,
      }));

  const handleRun = async () => {
    setRunError("");
    const players = buildPlayers();
    if (players.length === 0) {
      setRunError("Each active slot needs a primary role and at least one champion in the pool.");
      return;
    }
    try {
      const result = await runTeamComp({ players }).unwrap();
      setResults(result);
    } catch (err: any) {
      setRunError(err?.data?.message ?? "Failed to run algorithm.");
    }
  };

  const handleSaveComp = async (comp: GeneratedComp, name: string) => {
    const result = await saveComp({ compName: name, comp }).unwrap().catch(() => null);
    if (result !== null) showToast("Comp saved!");
  };

  const handleSaveQuery = async (name: string) => {
    const players = buildPlayers();
    if (!name || players.length === 0) return;
    const result = await createQuery({ queryName: name, players }).unwrap().catch(() => null);
    setSavingQuery(false);
    if (result !== null) {
      showToast("Query saved!");
      setLastSavedSlotsJson(JSON.stringify(slots));
    }
  };

  // Sort comps by overall score descending
  const sortedComps = useMemo(
    () => [...(results?.comps ?? [])].sort((a, b) => b.overallScore - a.overallScore),
    [results]
  );

  return (
    <div className="space-y-10 pb-6">

      {/* ── Hero ── */}
      <div className="space-y-4">
        <h1 className={`${oxanium.className} text-5xl sm:text-6xl font-extrabold uppercase leading-none tracking-tight`}>
          <span className="text-foreground">Team </span>
          <span className="text-gradient-primary">Generator</span>
        </h1>
        <div className="h-px w-full bg-linear-to-r from-primary/70 via-teal-500/30 to-transparent" />
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Configure up to 5 player slots with roles and champion pools. Our algorithm analyzes
          synergies, damage spread, and win conditions to generate the strongest compositions
          for your team. Linking Riot accounts enables mastery and win rate data.
        </p>
      </div>

      {/* ── Feature cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {FEATURES.map((f) => (
          <div
            key={f.label}
            className={`group relative overflow-hidden rounded-xl p-5 cursor-default transition-[transform] duration-300
              ${isDarkMode ? "bg-zinc-900/50 border border-zinc-800/80" : "bg-card border border-border"}`}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.borderColor = f.borderColor;
              el.style.boxShadow = f.shadow;
              el.style.transform = "translateY(-3px)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.borderColor = "";
              el.style.boxShadow = "";
              el.style.transform = "";
            }}
          >
            <div
              className={`h-0.5 mb-5 rounded-full ${f.barClass} transition-all duration-500 ease-out`}
              style={{ width: "1.5rem" }}
              ref={(el) => {
                if (!el) return;
                const card = el.closest(".group") as HTMLDivElement | null;
                if (!card) return;
                const expand = () => { el.style.width = "100%"; };
                const shrink = () => { el.style.width = "1.5rem"; };
                card.addEventListener("mouseenter", expand);
                card.addEventListener("mouseleave", shrink);
              }}
            />
            <f.Icon className={`h-7 w-7 ${f.colorClass} mb-3 transition-transform duration-300 group-hover:scale-110`} />
            <p className={`${oxanium.className} text-[11px] font-bold uppercase tracking-widest ${f.colorClass} mb-2`}>
              {f.label}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* ── Slot cards ── */}
      {/* ── Slot cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {slots.map((slot: any) => (
          <SummonerCard key={slot.slotIndex} slotIndex={slot.slotIndex} />
        ))}
      </div>

      {/* ── Generate CTA ── */}
      <div className="flex flex-col items-center gap-4 pt-2">
        <button
          onClick={handleRun}
          disabled={running || validSlots === 0}
          className={`${oxanium.className} group relative flex items-center gap-3 rounded-full bg-gradient-primary
            px-14 py-4 text-base font-bold uppercase tracking-[0.15em] text-white
            transition-all duration-300
            hover:scale-105 hover:shadow-[0_0_50px_rgba(139,92,246,0.55)]
            active:scale-100
            disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none`}
        >
          {running ? (
            <><Loader2 className="h-5 w-5 animate-spin" />Generating…</>
          ) : (
            <><Play className="h-5 w-5 fill-current" />Generate Comps</>
          )}
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLoadQuery(true)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-all hover:scale-105 ${isDarkMode ? "" : "border border-border text-muted-foreground hover:text-foreground hover:border-border/60"}`}
            style={isDarkMode ? {
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.55)",
            } : undefined}
            onMouseEnter={isDarkMode ? (e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.28)"; e.currentTarget.style.color = "rgba(255,255,255,0.9)"; } : undefined}
            onMouseLeave={isDarkMode ? (e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; } : undefined}
          >
            <FolderOpen className="h-3.5 w-3.5" />
            Load query
          </button>

          {validSlots > 0 && !savingQuery && JSON.stringify(slots) !== lastSavedSlotsJson && (
            <button
              onClick={() => setSavingQuery(true)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-all hover:scale-105 ${isDarkMode ? "" : "border border-border text-muted-foreground hover:text-foreground hover:border-border/60"}`}
              style={isDarkMode ? {
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.55)",
              } : undefined}
              onMouseEnter={isDarkMode ? (e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.28)"; e.currentTarget.style.color = "rgba(255,255,255,0.9)"; } : undefined}
              onMouseLeave={isDarkMode ? (e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; } : undefined}
            >
              <Save className="h-3.5 w-3.5" />Save as query
            </button>
          )}
        </div>

        {savingQuery && (
          <NameModal
            title="Save Query"
            placeholder="Query name…"
            confirmLabel="Save"
            onConfirm={handleSaveQuery}
            onCancel={() => setSavingQuery(false)}
            loading={savingQueryRequest}
            dm={isDarkMode}
          />
        )}

        {runError && <p className="text-xs text-destructive">{runError}</p>}
      </div>

      {/* ── Load Query modal ── */}
      {showLoadQuery && (
        <LoadQueryModal
          dm={isDarkMode}
          onLoad={(players) => {
            dispatch(loadQueryPlayers(players));
            showToast("Query loaded!");
          }}
          onClose={() => setShowLoadQuery(false)}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-lg px-4 py-3 shadow-xl text-sm font-semibold text-white"
          style={{ background: "rgba(22,163,74,0.95)", backdropFilter: "blur(8px)" }}
        >
          <CheckCircle className="h-4 w-4 shrink-0" />
          {toast}
        </div>
      )}

      {/* ── Results ── */}
      {sortedComps.length > 0 && (
        <div className="space-y-4 max-w-6xl mx-auto w-full">
          <div className="flex items-end gap-3">
            <h2 className={`${oxanium.className} text-2xl font-bold uppercase tracking-wide text-foreground`}>
              {sortedComps.length} Comp{sortedComps.length !== 1 ? "s" : ""} Generated
            </h2>
            <div className="mb-1 h-px flex-1 bg-linear-to-r from-primary/40 to-transparent" />
          </div>
          {sortedComps.map((comp, i) => (
            <CompCard key={i} comp={comp} onSave={handleSaveComp} nameToId={nameToId} dm={isDarkMode} />
          ))}
        </div>
      )}
    </div>
  );
}
