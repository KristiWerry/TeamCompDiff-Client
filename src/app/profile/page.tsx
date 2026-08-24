"use client";

import { useEffect, useState } from "react";
import { useAppDispatch } from "@/app/redux";
import { setMyRiotId } from "@/state/teamSlice";
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useLinkRiotAccountMutation,
  useRefreshCacheMutation,
  type UserProfile,
} from "@/state/api";
import { ALL_ROLES, ROLE_LABELS, type Role } from "@/lib/riot/types";
import ChampionPicker from "@/components/ChampionPicker";
import {
  BookOpen,
  ChevronRight,
  Edit2,
  Lightbulb,
  Loader2,
  RefreshCw,
  Sparkles,
  Sword,
  User,
} from "lucide-react";

// ── Section wrapper ────────────────────────────────────────────────────────

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
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

// ── Page ──────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const dispatch = useAppDispatch();

  const { data: profile, isLoading: profileLoading } = useGetProfileQuery();
  const [updateProfile, { isLoading: saving }] = useUpdateProfileMutation();
  const [linkRiot, { isLoading: linking }]     = useLinkRiotAccountMutation();
  const [refreshCache, { isLoading: refreshing }] = useRefreshCacheMutation();

  // Local draft state — synced from API on load
  const [displayName, setDisplayName]           = useState("");
  const [preferredRole, setPreferredRole]         = useState<Role | "">("");
  const [preferredSecondaryRole, setPreferredSecondaryRole] = useState<Role | "">("");
  const [champPool, setChampPool]               = useState<string[]>([]);
  const [profileDirty, setProfileDirty]         = useState(false);
  const [showChampPicker, setShowChampPicker]   = useState(false);

  // Riot linking
  const [riotIdInput, setRiotIdInput] = useState("");
  const [linkResult, setLinkResult]   = useState<{ riotId: string } | null>(null);
  const [linkError, setLinkError]     = useState("");
  const [refreshMsg, setRefreshMsg]   = useState("");

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName ?? "");
    setPreferredRole(profile.preferredRole ?? "");
    setPreferredSecondaryRole(profile.preferredSecondaryRole ?? "");
    setChampPool(profile.champPool ?? []);
    setProfileDirty(false);
  }, [profile]);

  const handleSaveProfile = async () => {
    const patch: Partial<UserProfile> = {
      displayName:            displayName.trim() || null,
      preferredRole:          preferredRole || null,
      preferredSecondaryRole: preferredSecondaryRole || null,
      champPool,
    };
    await updateProfile(patch).unwrap().catch(() => null);
    setProfileDirty(false);
  };

  const handleLinkRiot = async () => {
    setLinkError("");
    if (!riotIdInput.includes("#")) {
      setLinkError("Format: GameName#Tag");
      return;
    }
    try {
      const result = await linkRiot({ riotId: riotIdInput.trim() }).unwrap();
      setLinkResult(result);
      dispatch(setMyRiotId(result.riotId));
      setRiotIdInput("");
    } catch (err: any) {
      setLinkError(err?.data?.message ?? "Failed to link account.");
    }
  };

  const handleRefreshCache = async () => {
    setRefreshMsg("");
    try {
      const result = await refreshCache().unwrap();
      const total = result.refreshed.reduce((n, r) => n + r.champsTracked, 0);
      setRefreshMsg(`Refreshed ${result.refreshed.length} account(s) — ${total} champions tracked.`);
    } catch (err: any) {
      setRefreshMsg(err?.data?.message ?? "Refresh failed.");
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading profile…
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-2">
        <User className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold text-foreground">Profile</h1>
      </div>

      {/* ── Identity ── */}
      <Section icon={<User className="h-4 w-4" />} title="Identity">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-2 ring-border">
            {displayName ? (
              <span className="text-xl font-bold text-primary">{displayName.charAt(0).toUpperCase()}</span>
            ) : (
              <User className="h-7 w-7 text-muted-foreground" />
            )}
          </div>
          <div className="flex flex-1 flex-col gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => { setDisplayName(e.target.value); setProfileDirty(true); }}
                placeholder="Your name"
                className="w-full max-w-xs rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex gap-3">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Primary Role</label>
                <select
                  value={preferredRole}
                  onChange={(e) => { setPreferredRole(e.target.value as Role | ""); setProfileDirty(true); }}
                  className="rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">—</option>
                  {ALL_ROLES.filter((r) => r !== preferredSecondaryRole).map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Secondary Role</label>
                <select
                  value={preferredSecondaryRole}
                  onChange={(e) => { setPreferredSecondaryRole(e.target.value as Role | ""); setProfileDirty(true); }}
                  className="rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">—</option>
                  {ALL_ROLES.filter((r) => r !== preferredRole).map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </div>
            </div>
            {profileDirty && (
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex items-center gap-1.5 self-start rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save
              </button>
            )}
          </div>
        </div>
      </Section>

      {/* ── Riot Account ── */}
      <Section icon={<User className="h-4 w-4" />} title="Riot Account">
        {linkResult && (
          <div className="mb-3 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
            Linked: <span className="font-medium">{linkResult.riotId}</span>
          </div>
        )}
        <p className="mb-3 text-xs text-muted-foreground">
          Linking your Riot account enables win rate and mastery data in the algorithm.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="GameName#Tag"
            value={riotIdInput}
            onChange={(e) => setRiotIdInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLinkRiot()}
            className="flex-1 max-w-xs rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            onClick={handleLinkRiot}
            disabled={linking || !riotIdInput.trim()}
            className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {linking && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Link Account
          </button>
        </div>
        {linkError && <p className="mt-2 text-xs text-destructive">{linkError}</p>}

        <div className="mt-4 pt-4 border-t border-border flex items-center gap-3">
          <button
            onClick={handleRefreshCache}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-50"
          >
            {refreshing
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <RefreshCw className="h-3.5 w-3.5" />}
            Refresh match cache
          </button>
          {refreshMsg && <p className="text-xs text-muted-foreground">{refreshMsg}</p>}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Cache refresh fetches your last 50 matches (~60 s). Run this before generating comps for fresh data.
        </p>
      </Section>

      {/* ── Champion Pool ── */}
      <Section icon={<Sword className="h-4 w-4" />} title="Champion Pool">
        <div className="flex items-start justify-between gap-4 mb-3">
          <p className="text-xs text-muted-foreground">
            Your global pool — used by the algorithm when no per-slot pool is specified.
          </p>
          <button
            onClick={() => setShowChampPicker(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <Edit2 className="h-3 w-3" />
            Edit Pool
          </button>
        </div>
        {champPool.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {champPool.map((c) => (
              <span key={c} className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-foreground">
                {c}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">No champions selected yet.</p>
        )}
        {profileDirty && (
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="mt-3 flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save Pool
          </button>
        )}
        {showChampPicker && (
          <ChampionPicker
            title="Edit Champion Pool"
            selected={champPool}
            onChange={(p) => { setChampPool(p); setProfileDirty(true); }}
            onClose={() => setShowChampPicker(false)}
          />
        )}
      </Section>

      {/* ── Player Tendencies ── */}
      <Section icon={<BookOpen className="h-4 w-4" />} title="Player Tendencies">
        <p className="text-xs text-muted-foreground">
          Coming soon — tendencies will inform champion recommendations and draft suggestions.
        </p>
      </Section>

      {/* ── Champion Recommendation ── */}
      <Section icon={<Sparkles className="h-4 w-4" />} title="Champion Recommendation">
        <div className="flex items-start gap-4 rounded-lg border border-dashed border-border p-5">
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary/50" />
          <div>
            <p className="text-sm font-medium text-foreground">Recommendations coming soon</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Once your champion pool and match history are connected, we'll suggest new picks that
              complement your style and fill gaps in your team's composition.
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
