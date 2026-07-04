"use client";

import { Construction, Search } from "lucide-react";

export default function ScoutingPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Search className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold text-foreground">Opponent Scouting</h1>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-24 text-center">
        <Construction className="h-10 w-10 text-muted-foreground/40 mb-4" />
        <p className="text-base font-semibold text-foreground">Under Construction</p>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          Opponent scouting is on the way. You'll be able to look up enemy teams and analyze their
          champion pools before the match.
        </p>
      </div>
    </div>
  );
}
