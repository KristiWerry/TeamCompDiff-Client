"use client";

import { Construction } from "lucide-react";
import { Oxanium } from "next/font/google";

const oxanium = Oxanium({ subsets: ["latin"], weight: ["600", "700", "800"] });

export default function ScoutingPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className={`${oxanium.className} text-4xl sm:text-5xl font-extrabold uppercase leading-none tracking-tight`}>
          <span className="text-foreground">Opponent Scouting</span>
        </h1>
        <div className="h-px w-full bg-linear-to-r from-primary/70 via-teal-500/30 to-transparent" />
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
