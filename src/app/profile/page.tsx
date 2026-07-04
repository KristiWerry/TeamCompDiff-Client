"use client";

import { useState } from "react";
import {
  BookOpen,
  ChevronRight,
  Lightbulb,
  Plus,
  Shield,
  Sparkles,
  Sword,
  TrendingUp,
  User,
  Users,
  X,
} from "lucide-react";
import type { Region } from "@/lib/riot/types";

const REGIONS: Region[] = [
  "NA1", "EUW1", "EUN1", "KR", "BR1",
  "JP1", "OC1", "TR1", "RU", "LA1", "LA2",
  "PH2", "SG2", "TH2", "TW2", "VN2",
];

const TENDENCY_OPTIONS = [
  "Early aggressor", "Late-game scaler", "Team fighter",
  "Split pusher", "Roamer", "Vision control", "Engage-focused",
  "Peel-focused", "Farm-heavy", "Objective controller",
];

export default function ProfilePage() {
  // Summoner identity
  const [gameName, setGameName]   = useState("");
  const [tagLine, setTagLine]     = useState("");
  const [region, setRegion]       = useState<Region>("NA1");
  const [saved, setSaved]         = useState(false);

  // Teammates
  const [teammates, setTeammates]   = useState<string[]>([]);
  const [newTeammate, setNewTeammate] = useState("");

  // Champ pool
  const [champPool, setChampPool]   = useState<string[]>([]);
  const [newChamp, setNewChamp]     = useState("");

  // Tendencies
  const [tendencies, setTendencies] = useState<Set<string>>(new Set());

  const handleSaveSummoner = () => {
    if (!gameName.trim()) return;
    setSaved(true);
  };

  const addTeammate = () => {
    const name = newTeammate.trim();
    if (name && !teammates.includes(name)) {
      setTeammates((prev) => [...prev, name]);
    }
    setNewTeammate("");
  };

  const addChamp = () => {
    const name = newChamp.trim();
    if (name && !champPool.includes(name)) {
      setChampPool((prev) => [...prev, name]);
    }
    setNewChamp("");
  };

  const toggleTendency = (t: string) => {
    setTendencies((prev) => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Page header */}
      <div className="flex items-center gap-2">
        <User className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold text-foreground">Profile</h1>
      </div>

      {/* ── Summoner ID ── */}
      <Section icon={<Shield className="h-4 w-4" />} title="Summoner">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          {/* Avatar placeholder */}
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-2 ring-border">
            {saved && gameName ? (
              <span className="text-xl font-bold text-primary">
                {gameName.charAt(0).toUpperCase()}
              </span>
            ) : (
              <User className="h-7 w-7 text-muted-foreground" />
            )}
          </div>

          <div className="flex flex-1 flex-col gap-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-muted-foreground">Game Name</label>
                <input
                  type="text"
                  value={gameName}
                  onChange={(e) => { setGameName(e.target.value); setSaved(false); }}
                  placeholder="Doublelift"
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="w-24">
                <label className="mb-1 block text-xs text-muted-foreground">Tag</label>
                <input
                  type="text"
                  value={tagLine}
                  onChange={(e) => { setTagLine(e.target.value); setSaved(false); }}
                  placeholder="NA1"
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            <div className="flex items-end gap-2">
              <div className="w-36">
                <label className="mb-1 block text-xs text-muted-foreground">Region</label>
                <select
                  value={region}
                  onChange={(e) => { setRegion(e.target.value as Region); setSaved(false); }}
                  className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <button
                onClick={handleSaveSummoner}
                disabled={!gameName.trim()}
                className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40"
              >
                {saved ? "Saved ✓" : "Save"}
              </button>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Regular Teammates ── */}
      <Section icon={<Users className="h-4 w-4" />} title="Regular Teammates">
        <p className="mb-3 text-xs text-muted-foreground">
          Summoners you frequently play with — used to pre-fill Team Analysis.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTeammate}
            onChange={(e) => setNewTeammate(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTeammate()}
            placeholder="Summoner name"
            className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            onClick={addTeammate}
            disabled={!newTeammate.trim()}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
        {teammates.length > 0 && (
          <ul className="mt-3 flex flex-col gap-1">
            {teammates.map((t) => (
              <li
                key={t}
                className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
              >
                <span className="text-foreground">{t}</span>
                <button
                  onClick={() => setTeammates((prev) => prev.filter((x) => x !== t))}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* ── Champion Pool ── */}
      <Section icon={<Sword className="h-4 w-4" />} title="Champion Pool">
        <p className="mb-3 text-xs text-muted-foreground">
          Champions you actively play — used across Team Analysis, Draft, and recommendations.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newChamp}
            onChange={(e) => setNewChamp(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addChamp()}
            placeholder="Champion name"
            className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            onClick={addChamp}
            disabled={!newChamp.trim()}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
        {champPool.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {champPool.map((c) => (
              <span
                key={c}
                className="flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-medium text-foreground"
              >
                {c}
                <button
                  onClick={() => setChampPool((prev) => prev.filter((x) => x !== c))}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </Section>

      {/* ── Champ Stats ── */}
      <Section icon={<TrendingUp className="h-4 w-4" />} title="Champion Stats">
        {champPool.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Add champions to your pool above to see stats here.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Champion</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Games</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Win Rate</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">KDA</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Mastery</th>
                </tr>
              </thead>
              <tbody>
                {champPool.map((c, i) => (
                  <tr key={c} className={i < champPool.length - 1 ? "border-b border-border" : ""}>
                    <td className="px-4 py-2.5 font-medium text-foreground">{c}</td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">—</td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">—</td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">—</td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          Stats will populate once your summoner is connected to the Riot API.
        </p>
      </Section>

      {/* ── Player Tendencies ── */}
      <Section icon={<BookOpen className="h-4 w-4" />} title="Player Tendencies">
        <p className="mb-3 text-xs text-muted-foreground">
          Select the playstyles that describe you — used to tailor Draft and champ recommendations.
        </p>
        <div className="flex flex-wrap gap-2">
          {TENDENCY_OPTIONS.map((t) => {
            const active = tendencies.has(t);
            return (
              <button
                key={t}
                onClick={() => toggleTendency(t)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors
                  ${active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </Section>

      {/* ── New Champ Recommendation ── */}
      <Section icon={<Sparkles className="h-4 w-4" />} title="Champion Recommendation">
        <div className="flex items-start gap-4 rounded-lg border border-dashed border-border p-5">
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary/50" />
          <div>
            <p className="text-sm font-medium text-foreground">Recommendations coming soon</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Once your champion pool, tendencies, and match history are connected, we'll suggest
              new picks that complement your style and fill gaps in your team's composition.
            </p>
            <button
              disabled
              className="mt-3 flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary opacity-50 cursor-not-allowed"
            >
              <ChevronRight className="h-3.5 w-3.5" />
              Generate recommendations
            </button>
          </div>
        </div>
      </Section>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2 text-foreground">
        <span className="text-primary">{icon}</span>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}
