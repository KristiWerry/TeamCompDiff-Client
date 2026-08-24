"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/app/redux";
import { loadQueryPlayers } from "@/state/teamSlice";
import {
  useGetCompsQuery,
  useDeleteCompMutation,
  useGetQueriesQuery,
  useDeleteQueryMutation,
  useRunQueryMutation,
  type SavedComp,
  type SavedQuery,
} from "@/state/api";
import {
  BarChart3,
  BookmarkX,
  Loader2,
  Play,
  RefreshCw,
  Trash2,
} from "lucide-react";

type Tab = "comps" | "queries";

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

// ── Saved comp card ───────────────────────────────────────────────────────

function CompCard({ comp, onDelete }: { comp: SavedComp; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-foreground">{comp.compName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {comp.comp.archetype} · Saved {fmt(comp.savedAt)}
          </p>
        </div>
        <button
          onClick={onDelete}
          className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Role assignments */}
      <div className="grid grid-cols-5 gap-1">
        {["top", "jungle", "mid", "adc", "support"].map((role) => {
          const pick = comp.comp.picks.find((p) => p.role === role);
          const top  = pick?.suggestions?.[0];
          return (
            <div key={role} className="rounded bg-muted/40 px-1.5 py-1.5 text-center">
              <div className="text-[9px] text-muted-foreground capitalize">{role}</div>
              <div className="text-[10px] font-medium text-foreground truncate">{top?.champion ?? "—"}</div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => setExpanded((p) => !p)}
        className="text-xs text-primary hover:underline text-left"
      >
        {expanded ? "Hide details" : "Show details"}
      </button>

      {expanded && (
        <div className="space-y-2 text-xs text-muted-foreground border-t border-border pt-3">
          <p className="text-foreground">{comp.comp.description}</p>
          <div className="flex flex-wrap gap-3">
            <span>Power spike: <span className="text-foreground capitalize">{comp.comp.analysis.powerSpike}</span></span>
            <span>Engage: <span className="text-foreground">{comp.comp.analysis.engage}</span></span>
            <span>Difficulty: <span className="text-foreground">{comp.comp.analysis.difficulty}/10</span></span>
          </div>
          <ul className="space-y-0.5">
            {comp.comp.analysis.winConditions.map((wc, i) => (
              <li key={i} className="flex gap-1.5"><span className="text-primary">·</span>{wc}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Saved query card ──────────────────────────────────────────────────────

function QueryCard({ query, onDelete }: { query: SavedQuery; onDelete: () => void }) {
  const dispatch = useAppDispatch();
  const router   = useRouter();
  const [runQuery, { isLoading: running }] = useRunQueryMutation();
  const [lastResult, setLastResult] = useState(query.lastResult);
  const [runError, setRunError]     = useState("");

  const handleRun = async () => {
    setRunError("");
    try {
      const res = await runQuery(query.queryId).unwrap();
      setLastResult(res);
    } catch (err: any) {
      setRunError(err?.data?.message ?? "Run failed.");
    }
  };

  const handleLoad = () => {
    dispatch(loadQueryPlayers(query.players));
    router.push("/");
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-foreground">{query.queryName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Created {fmt(query.createdAt)}
            {query.lastRunAt && <> · Last run {fmt(query.lastRunAt)}</>}
          </p>
        </div>
        <button
          onClick={onDelete}
          className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Players summary */}
      <div className="flex flex-wrap gap-1.5">
        {query.players.map((p, i) => (
          <span key={i} className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium text-foreground capitalize">
            {p.primaryRole}{p.secondaryRole ? ` / ${p.secondaryRole}` : ""}
            {p.riotId ? ` — ${p.riotId}` : ""}
          </span>
        ))}
      </div>

      {runError && <p className="text-xs text-destructive">{runError}</p>}

      {/* Last result preview */}
      {lastResult && (
        <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          Last run returned {lastResult.comps.length} comp{lastResult.comps.length !== 1 ? "s" : ""}:&nbsp;
          <span className="text-foreground">{lastResult.comps.map((c) => c.archetype).join(", ")}</span>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleRun}
          disabled={running}
          className="flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 disabled:opacity-50"
        >
          {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
          Run again
        </button>
        <button
          onClick={handleLoad}
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Load into Team Generator
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function CompsPage() {
  const [tab, setTab] = useState<Tab>("comps");

  const { data: compsData,   isLoading: compsLoading   } = useGetCompsQuery();
  const { data: queriesData, isLoading: queriesLoading } = useGetQueriesQuery();
  const [deleteComp]  = useDeleteCompMutation();
  const [deleteQuery] = useDeleteQueryMutation();

  const comps   = compsData?.comps   ?? [];
  const queries = queriesData?.queries ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold text-foreground">Team Comps</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(["comps", "queries"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize
              ${tab === t
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {t === "comps" ? "Saved Comps" : "Saved Queries"}
            {t === "comps" && comps.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                {comps.length}
              </span>
            )}
            {t === "queries" && queries.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                {queries.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Comps tab */}
      {tab === "comps" && (
        <>
          {compsLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : comps.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
              <BookmarkX className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-foreground">No saved comps yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Run the algorithm on Team Generator and save a comp you like.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {comps.map((comp) => (
                <CompCard
                  key={comp.compId}
                  comp={comp}
                  onDelete={() => deleteComp(comp.compId)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Queries tab */}
      {tab === "queries" && (
        <>
          {queriesLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : queries.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
              <BookmarkX className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-foreground">No saved queries yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                After adding players on Team Generator, click "Save query" to store the inputs for later.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {queries.map((query) => (
                <QueryCard
                  key={query.queryId}
                  query={query}
                  onDelete={() => deleteQuery(query.queryId)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
