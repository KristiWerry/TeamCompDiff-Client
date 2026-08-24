"use client";

import { useEffect, useRef, useState } from "react";
import { Oxanium } from "next/font/google";
import { useAppDispatch, useAppSelector } from "@/app/redux";
import { setChampions, initMatchesFromCache } from "@/state/teamSlice";
import { getCachedMatches } from "@/lib/matchCache";
import SummonerCard from "@/components/Team/SummonerCard";
import {
  useGetChampionsQuery,
  useRunTeamCompMutation,
  useSaveCompMutation,
  useCreateQueryMutation,
  type PlayerInput,
  type GeneratedComp,
  type TeamCompResponse,
} from "@/state/api";
import type { Role } from "@/lib/riot/types";
import {
  BookmarkPlus,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Play,
  Save,
  Swords,
  Target,
  BarChart3,
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

// ── Comp result card ──────────────────────────────────────────────────────

function CompCard({
  comp,
  onSave,
}: {
  comp: GeneratedComp;
  onSave: (comp: GeneratedComp, name: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [compName, setCompName] = useState("");

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(comp, compName.trim() || `${comp.archetype} Comp`);
    setIsSaving(false);
    setSaving(false);
    setCompName("");
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <span className={`${oxanium.className} font-bold uppercase tracking-wide text-foreground`}>
            {comp.archetype}
          </span>
          <span className="ml-2 text-xs text-muted-foreground">· {comp.description}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Difficulty {comp.analysis.difficulty}/10</span>
          <button onClick={() => setExpanded((p) => !p)} className="p-1 rounded hover:bg-accent">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 divide-x divide-border border-b border-border">
        {["top", "jungle", "mid", "adc", "support"].map((role) => {
          const pick = comp.picks.find((p) => p.role === role);
          const top  = pick?.suggestions?.[0];
          return (
            <div key={role} className="px-2 py-2 text-center">
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">{role}</div>
              <div className="text-xs font-bold text-foreground truncate">{top?.champion ?? "—"}</div>
              {top?.winRate && <div className="text-[10px] text-muted-foreground">{top.winRate}</div>}
            </div>
          );
        })}
      </div>

      {expanded && (
        <div className="p-4 space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
              Win Conditions
            </p>
            <ul className="space-y-1">
              {comp.analysis.winConditions.map((wc, i) => (
                <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                  <span className="text-primary shrink-0">·</span>{wc}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>Power spike: <span className="text-foreground font-medium capitalize">{comp.analysis.powerSpike}</span></span>
            <span>Engage: <span className="text-foreground font-medium">{comp.analysis.engage}</span></span>
            <span>Synergy: <span className="text-foreground font-medium">{comp.analysis.synergies.overall}/10</span></span>
          </div>
          <div className="space-y-2">
            {comp.picks.map((pick) => (
              <div key={pick.role} className="rounded-lg bg-muted/30 px-3 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{pick.role}</span>
                  {pick.player && <span className="text-[10px] text-muted-foreground">— {pick.player}</span>}
                </div>
                <div className="space-y-1">
                  {pick.suggestions.map((s, i) => (
                    <div key={i} className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-medium text-foreground">{s.champion}</span>
                        <span className="ml-1.5 text-[10px] text-muted-foreground">{s.impactNote}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-foreground">{s.score.toFixed(1)}</span>
                        {s.winRate && <div className="text-[10px] text-muted-foreground">{s.winRate}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground italic">{comp.analysis.suggestedPlaystyle}</p>
        </div>
      )}

      <div className="border-t border-border px-4 py-2 flex items-center gap-2">
        {saving ? (
          <>
            <input
              autoFocus type="text" placeholder={`${comp.archetype} Comp`}
              value={compName}
              disabled={isSaving}
              onChange={(e) => setCompName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape" && !isSaving) setSaving(false); }}
              className="flex-1 rounded border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => setSaving(false)}
              disabled={isSaving}
              className="rounded border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </>
        ) : (
          <button onClick={() => setSaving(true)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <BookmarkPlus className="h-3.5 w-3.5" />Save comp
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function TeamPage() {
  const dispatch   = useAppDispatch();
  const slots      = useAppSelector((s: any) => s.team?.slots ?? []) as any[];
  const isDarkMode = useAppSelector((s: any) => s.global?.isDarkMode ?? false);

  // A slot is valid when it has both a primary role AND at least one champion
  const validSlots = slots.filter((s: any) => s.primaryRole && s.slotChampPool?.length > 0).length;

  const { data: champData } = useGetChampionsQuery();

  const [runTeamComp, { isLoading: running }] = useRunTeamCompMutation();
  const [saveComp] = useSaveCompMutation();
  const [createQuery, { isLoading: savingQueryRequest }] = useCreateQueryMutation();
  const [results, setResults]                  = useState<TeamCompResponse | null>(null);
  const [runError, setRunError]                = useState("");
  const [savingQuery, setSavingQuery]          = useState(false);
  const [queryName, setQueryName]              = useState("");
  const [toast, setToast]                      = useState("");
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
        primaryRole:   s.primaryRole as Role,
        secondaryRole: s.secondaryRole as Role | undefined,
        champPool:     s.slotChampPool,
        riotId:        s.gameName && s.tagLine ? `${s.gameName}#${s.tagLine}` : undefined,
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

  const handleSaveComp  = async (comp: GeneratedComp, name: string) => {
    const result = await saveComp({ compName: name, comp }).unwrap().catch(() => null);
    if (result !== null) showToast("Comp saved!");
  };

  const handleSaveQuery = async () => {
    const players = buildPlayers();
    if (!queryName.trim() || players.length === 0) return;
    const result = await createQuery({ queryName: queryName.trim(), players }).unwrap().catch(() => null);
    setSavingQuery(false);
    setQueryName("");
    if (result !== null) {
      showToast("Query saved!");
      setLastSavedSlotsJson(JSON.stringify(slots));
    }
  };

  return (
    <div className="space-y-10 pb-6">

      {/* ── Hero ── */}
      <div className="space-y-4">
        {/* Title */}
        <h1 className={`${oxanium.className} text-5xl sm:text-6xl font-extrabold uppercase leading-none tracking-tight`}>
          <span className="text-foreground">Team </span>
          <span className="text-gradient-primary">Generator</span>
        </h1>

        {/* Gradient separator */}
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
              ${isDarkMode
                ? "bg-zinc-900/50 border border-zinc-800/80"
                : "bg-card border border-border"}`}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.borderColor = f.borderColor;
              el.style.boxShadow   = f.shadow;
              el.style.transform   = "translateY(-3px)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.borderColor = "";
              el.style.boxShadow   = "";
              el.style.transform   = "";
            }}
          >
            {/* Expanding colored bar — the key differentiator */}
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

        {validSlots > 0 && !savingQuery && JSON.stringify(slots) !== lastSavedSlotsJson && (
          <button
            onClick={() => setSavingQuery(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Save className="h-3.5 w-3.5" />Save as query
          </button>
        )}

        {savingQuery && (
          <div className="flex items-center gap-2">
            <input
              autoFocus type="text" placeholder="Query name…" value={queryName}
              disabled={savingQueryRequest}
              onChange={(e) => setQueryName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSaveQuery(); if (e.key === "Escape" && !savingQueryRequest) setSavingQuery(false); }}
              className="w-44 rounded border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSaveQuery}
              disabled={savingQueryRequest}
              className="rounded bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingQueryRequest ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => setSavingQuery(false)}
              disabled={savingQueryRequest}
              className="rounded border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        )}

        {runError && <p className="text-xs text-destructive">{runError}</p>}
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-lg px-4 py-3 shadow-xl text-sm font-semibold text-white"
          style={{ background: "rgba(22,163,74,0.95)", backdropFilter: "blur(8px)" }}>
          <CheckCircle className="h-4 w-4 shrink-0" />
          {toast}
        </div>
      )}

      {/* ── Results ── */}
      {results && (
        <div className="space-y-4">
          <div className="flex items-end gap-3">
            <h2 className={`${oxanium.className} text-2xl font-bold uppercase tracking-wide text-foreground`}>
              {results.comps.length} Comp{results.comps.length !== 1 ? "s" : ""} Generated
            </h2>
            <div className="mb-1 h-px flex-1 bg-linear-to-r from-primary/40 to-transparent" />
          </div>
          {results.comps.map((comp, i) => (
            <CompCard key={i} comp={comp} onSave={handleSaveComp} />
          ))}
        </div>
      )}
    </div>
  );
}
