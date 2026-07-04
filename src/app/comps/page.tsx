"use client";

import { useAppDispatch, useAppSelector } from "@/app/redux";
import { deleteComp, loadComp, type SavedComp } from "@/state/teamSlice";
import { useRouter } from "next/navigation";
import { BarChart3, BookmarkX, ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";

export default function CompsPage() {
  const dispatch    = useAppDispatch();
  const router      = useRouter();
  const savedComps  = useAppSelector((s: any) => (s.team?.savedComps ?? []) as SavedComp[]);

  const handleLoad = (id: string) => {
    dispatch(loadComp(id));
    router.push("/");
  };

  const handleDelete = (id: string) => {
    dispatch(deleteComp(id));
  };

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  const activeSummoners = (comp: SavedComp) =>
    comp.slots.filter((s) => s.gameName);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Team Comps</h1>
          {savedComps.length > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {savedComps.length} saved
            </span>
          )}
        </div>
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Team Analysis
        </Link>
      </div>

      {/* Empty state */}
      {savedComps.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <BookmarkX className="mx-auto h-8 w-8 text-muted-foreground/50 mb-3" />
          <p className="text-sm font-medium text-foreground">No saved comps yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Go to{" "}
            <Link href="/" className="text-primary underline underline-offset-2">
              Team Analysis
            </Link>{" "}
            and click <span className="font-medium">Save Comp</span> after loading your team.
          </p>
        </div>
      )}

      {/* Comp cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {savedComps.map((comp) => {
          const summoners = activeSummoners(comp);
          return (
            <div
              key={comp.id}
              className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4"
            >
              {/* Card header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-foreground leading-tight">{comp.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(comp.createdAt)}</p>
                </div>
                <button
                  onClick={() => handleDelete(comp.id)}
                  title="Delete comp"
                  className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Summoner list */}
              <div className="flex flex-wrap gap-1.5">
                {summoners.length > 0 ? (
                  summoners.map((s) => (
                    <span
                      key={s.slotIndex}
                      className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground"
                    >
                      {s.gameName}
                      {s.tagLine ? <span className="text-muted-foreground">#{s.tagLine}</span> : null}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">No summoners</span>
                )}
              </div>

              {/* Meta row */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="capitalize">{comp.queueFilter} queues</span>
                <span>·</span>
                <span>Min {comp.numTeammates} together</span>
              </div>

              {/* Load button */}
              <button
                onClick={() => handleLoad(comp.id)}
                className="mt-auto w-full rounded-md bg-primary/10 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
              >
                Load into Team Analysis
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
