"use client";

import { useEffect, useMemo, useState } from "react";
import { Oxanium } from "next/font/google";
import { useAppDispatch, useAppSelector } from "@/app/redux";
import { setMyRiotId } from "@/state/teamSlice";
import {
  useGetProfileQuery,
  useGetChampionsQuery,
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

const oxanium = Oxanium({ subsets: ["latin"], weight: ["600", "700", "800"] });

// ── Image / role helpers ───────────────────────────────────────────────────

const DDRAG_ICON = (id: string) =>
  `https://ddragon.leagueoflegends.com/cdn/16.16.1/img/champion/${id}.png`;

const CDRAG_POS =
  "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions";
const ROLE_POS: Record<string, string> = {
  top: "top", jungle: "jungle", mid: "middle", adc: "bottom", support: "utility",
};
const roleIconUrl = (role: string) =>
  `${CDRAG_POS}/icon-position-${ROLE_POS[role] ?? role}.png`;

const ROLE_COLORS: Record<string, string> = {
  top:     "239,68,68",
  jungle:  "34,197,94",
  mid:     "139,92,246",
  adc:     "245,158,11",
  support: "59,130,246",
};

// ── Section wrapper ────────────────────────────────────────────────────────

function Section({
  icon,
  title,
  children,
  dm,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  dm: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-5 ${dm ? "" : "bg-card border border-border"}`}
      style={dm ? { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" } : undefined}
    >
      <div className="mb-4 flex items-center gap-2">
        <span style={dm ? { color: "#A78BFA" } : undefined} className={dm ? "" : "text-primary"}>
          {icon}
        </span>
        <h2
          className={`text-sm font-semibold ${dm ? "" : "text-foreground"}`}
          style={dm ? { color: "rgba(255,255,255,0.85)" } : undefined}
        >
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

// ── RoleSelector ───────────────────────────────────────────────────────────

function RoleSelector({
  label,
  value,
  exclude,
  onChange,
  dm,
}: {
  label: string;
  value: Role | "";
  exclude: Role | "";
  onChange: (r: Role | "") => void;
  dm: boolean;
}) {
  return (
    <div>
      <p
        className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${dm ? "" : "text-muted-foreground"}`}
        style={dm ? { color: "rgba(255,255,255,0.35)" } : undefined}
      >
        {label}
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        {ALL_ROLES.map((role) => {
          const isActive   = value === role;
          const isExcluded = exclude === role;
          const color      = ROLE_COLORS[role] ?? "255,255,255";
          return (
            <button
              key={role}
              title={ROLE_LABELS[role]}
              disabled={isExcluded}
              onClick={() => onChange(isActive ? "" : role)}
              className="flex items-center justify-center rounded-full h-10 w-10 transition-all hover:scale-105 disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={isActive ? {
                background: `rgba(${color}, 0.2)`,
                border: `1.5px solid rgba(${color}, 0.6)`,
                boxShadow: `0 0 10px rgba(${color}, 0.35)`,
              } : {
                background: dm ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.07)",
                border: dm ? "1.5px solid rgba(255,255,255,0.08)" : "1.5px solid rgba(0,0,0,0.18)",
              }}
            >
              <img
                src={roleIconUrl(role)}
                alt={role}
                className="h-5 w-5"
                style={{
                  filter: !isActive && !dm ? "grayscale(1) brightness(0.45)" : "grayscale(1) brightness(4)",
                  opacity: isActive ? 1 : (dm ? 0.25 : 0.75),
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── ChampionGrid ───────────────────────────────────────────────────────────

function ChampionGrid({
  champPool,
  nameToId,
  dm,
  onEdit,
}: {
  champPool: string[];
  nameToId: Record<string, string>;
  dm: boolean;
  onEdit: () => void;
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-4 mb-4">
        <p
          className={`text-xs ${dm ? "" : "text-muted-foreground"}`}
          style={dm ? { color: "rgba(255,255,255,0.4)" } : undefined}
        >
          Your global pool — used by the algorithm when no per-slot pool is specified.
        </p>
        <button
          onClick={onEdit}
          className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors ${dm ? "" : "border border-border text-muted-foreground hover:text-foreground hover:bg-accent"}`}
          style={dm ? { border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)" } : undefined}
          onMouseEnter={dm ? (e) => { e.currentTarget.style.color = "rgba(255,255,255,0.85)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; } : undefined}
          onMouseLeave={dm ? (e) => { e.currentTarget.style.color = "rgba(255,255,255,0.45)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; } : undefined}
        >
          <Edit2 className="h-3 w-3" />
          Edit Pool
        </button>
      </div>

      {champPool.length === 0 ? (
        <p
          className={`text-xs italic ${dm ? "" : "text-muted-foreground"}`}
          style={dm ? { color: "rgba(255,255,255,0.3)" } : undefined}
        >
          No champions selected yet.
        </p>
      ) : (
        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(56px, 1fr))" }}>
          {champPool.map((champName) => {
            const id = nameToId[champName];
            return (
              <div key={champName} className="flex flex-col items-center gap-1">
                <div
                  className="w-12 h-12 rounded-md overflow-hidden shrink-0"
                  style={{ border: dm ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)" }}
                >
                  {id && (
                    <img src={DDRAG_ICON(id)} alt={champName} className="w-full h-full object-cover" />
                  )}
                </div>
                <span
                  className={`text-[9px] text-center w-full truncate leading-tight ${dm ? "" : "text-muted-foreground"}`}
                  style={dm ? { color: "rgba(255,255,255,0.45)" } : undefined}
                >
                  {champName}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const dispatch   = useAppDispatch();
  const isDarkMode = useAppSelector((s: any) => s.global?.isDarkMode ?? false);
  const dm         = isDarkMode;

  const { data: profile, isLoading: profileLoading } = useGetProfileQuery();
  const { data: champData }                           = useGetChampionsQuery();
  const [updateProfile, { isLoading: saving }]        = useUpdateProfileMutation();
  const [linkRiot, { isLoading: linking }]            = useLinkRiotAccountMutation();
  const [refreshCache, { isLoading: refreshing }]     = useRefreshCacheMutation();

  const nameToId = useMemo(
    () =>
      Object.entries(champData?.data ?? {}).reduce(
        (acc: Record<string, string>, [id, data]) => { acc[data.name] = id; return acc; },
        {}
      ),
    [champData]
  );

  const [displayName, setDisplayName]                       = useState("");
  const [preferredRole, setPreferredRole]                   = useState<Role | "">("");
  const [preferredSecondaryRole, setPreferredSecondaryRole] = useState<Role | "">("");
  const [champPool, setChampPool]                           = useState<string[]>([]);
  const [profileDirty, setProfileDirty]                     = useState(false);
  const [showChampPicker, setShowChampPicker]               = useState(false);

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
    if (!riotIdInput.includes("#")) { setLinkError("Format: GameName#Tag"); return; }
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
      const total  = result.refreshed.reduce((n, r) => n + r.champsTracked, 0);
      setRefreshMsg(`Refreshed ${result.refreshed.length} account(s) — ${total} champions tracked.`);
    } catch (err: any) {
      setRefreshMsg(err?.data?.message ?? "Refresh failed.");
    }
  };

  if (profileLoading) {
    return (
      <div
        className={`flex items-center gap-2 text-sm ${dm ? "" : "text-muted-foreground"}`}
        style={dm ? { color: "rgba(255,255,255,0.4)" } : undefined}
      >
        <Loader2 className="h-4 w-4 animate-spin" /> Loading profile…
      </div>
    );
  }

  const inputStyle = dm
    ? { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)" }
    : undefined;
  const inputClass = `rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring ${dm ? "" : "border border-input bg-background"}`;
  const saveBtnStyle = { background: "linear-gradient(135deg, rgba(139,92,246,1) 0%, rgba(99,60,220,1) 100%)" };

  return (
    <div className="space-y-6">

      {/* ── Hero — full width ── */}
      <div className="space-y-3">
        <h1 className={`${oxanium.className} text-4xl sm:text-5xl font-extrabold uppercase leading-none tracking-tight`}>
          <span
            className={dm ? "" : "text-foreground"}
            style={dm ? { color: "rgba(255,255,255,0.92)" } : undefined}
          >
            Profile
          </span>
        </h1>
        <div className="h-px w-full bg-linear-to-r from-primary/70 via-teal-500/30 to-transparent" />
      </div>

      {/* ── Constrained content ── */}
      <div className="space-y-6 max-w-4xl mx-auto w-full">

      {/* ── Identity ── */}
      <Section icon={<User className="h-4 w-4" />} title="Identity" dm={dm}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full"
            style={dm
              ? { background: "rgba(139,92,246,0.1)", border: "2px solid rgba(255,255,255,0.07)" }
              : undefined}
          >
            {displayName ? (
              <span
                className={`text-xl font-bold ${dm ? "" : "text-primary"}`}
                style={dm ? { color: "#A78BFA" } : undefined}
              >
                {displayName.charAt(0).toUpperCase()}
              </span>
            ) : (
              <User
                className={`h-7 w-7 ${dm ? "" : "text-muted-foreground"}`}
                style={dm ? { color: "rgba(255,255,255,0.3)" } : undefined}
              />
            )}
          </div>
          {/* Fields */}
          <div className="flex flex-1 flex-col gap-5">
            <div>
              <label
                className={`mb-1 block text-xs ${dm ? "" : "text-muted-foreground"}`}
                style={dm ? { color: "rgba(255,255,255,0.4)" } : undefined}
              >
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => { setDisplayName(e.target.value); setProfileDirty(true); }}
                placeholder="Your name"
                className={`${inputClass} w-full max-w-xs`}
                style={inputStyle}
              />
            </div>

            <RoleSelector
              label="Primary Role"
              value={preferredRole}
              exclude={preferredSecondaryRole}
              onChange={(r) => { setPreferredRole(r); setProfileDirty(true); }}
              dm={dm}
            />
            <RoleSelector
              label="Secondary Role"
              value={preferredSecondaryRole}
              exclude={preferredRole}
              onChange={(r) => { setPreferredSecondaryRole(r); setProfileDirty(true); }}
              dm={dm}
            />

            {profileDirty && (
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex items-center gap-1.5 self-start rounded-md px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                style={saveBtnStyle}
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save
              </button>
            )}
          </div>
        </div>
      </Section>

      {/* ── Champion Pool ── */}
      <Section icon={<Sword className="h-4 w-4" />} title="Champion Pool" dm={dm}>
        <ChampionGrid
          champPool={champPool}
          nameToId={nameToId}
          dm={dm}
          onEdit={() => setShowChampPicker(true)}
        />
        {profileDirty && (
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="mt-4 flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            style={saveBtnStyle}
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

      {/* ── Riot Account ── */}
      <Section icon={<User className="h-4 w-4" />} title="Riot Account" dm={dm}>
        {linkResult && (
          <div
            className={`mb-3 rounded-lg px-3 py-2 text-sm ${dm ? "" : "bg-primary/10 text-primary"}`}
            style={dm ? { background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)", color: "rgba(167,139,250,1)" } : undefined}
          >
            Linked: <span className="font-medium">{linkResult.riotId}</span>
          </div>
        )}
        <p
          className={`mb-3 text-xs ${dm ? "" : "text-muted-foreground"}`}
          style={dm ? { color: "rgba(255,255,255,0.4)" } : undefined}
        >
          Linking your Riot account enables win rate and mastery data in the algorithm.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="GameName#Tag"
            value={riotIdInput}
            onChange={(e) => setRiotIdInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLinkRiot()}
            className={`${inputClass} flex-1 max-w-xs`}
            style={inputStyle}
          />
          <button
            onClick={handleLinkRiot}
            disabled={linking || !riotIdInput.trim()}
            className="flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            style={saveBtnStyle}
          >
            {linking && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Link Account
          </button>
        </div>
        {linkError && (
          <p
            className={`mt-2 text-xs ${dm ? "" : "text-destructive"}`}
            style={dm ? { color: "rgba(239,68,68,0.85)" } : undefined}
          >
            {linkError}
          </p>
        )}

        <div
          className="mt-4 pt-4 flex items-center gap-3"
          style={{ borderTop: dm ? "1px solid rgba(255,255,255,0.07)" : "1px solid var(--border)" }}
        >
          <button
            onClick={handleRefreshCache}
            disabled={refreshing}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors disabled:opacity-50 ${dm ? "" : "border border-border text-muted-foreground hover:text-foreground hover:bg-accent"}`}
            style={dm ? { border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)" } : undefined}
            onMouseEnter={dm ? (e) => { e.currentTarget.style.color = "rgba(255,255,255,0.85)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; } : undefined}
            onMouseLeave={dm ? (e) => { e.currentTarget.style.color = "rgba(255,255,255,0.45)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; } : undefined}
          >
            {refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Refresh match cache
          </button>
          {refreshMsg && (
            <p
              className={`text-xs ${dm ? "" : "text-muted-foreground"}`}
              style={dm ? { color: "rgba(255,255,255,0.4)" } : undefined}
            >
              {refreshMsg}
            </p>
          )}
        </div>
        <p
          className={`mt-2 text-xs ${dm ? "" : "text-muted-foreground"}`}
          style={dm ? { color: "rgba(255,255,255,0.3)" } : undefined}
        >
          Cache refresh fetches your last 50 matches (~60 s). Run this before generating comps for fresh data.
        </p>
      </Section>

      {/* ── Player Tendencies ── */}
      <Section icon={<BookOpen className="h-4 w-4" />} title="Player Tendencies" dm={dm}>
        <div
          className={`rounded-lg p-4 ${dm ? "" : "bg-muted/30 border border-dashed border-border"}`}
          style={dm ? { background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.07)" } : undefined}
        >
          <p
            className={`text-xs ${dm ? "" : "text-muted-foreground"}`}
            style={dm ? { color: "rgba(255,255,255,0.35)" } : undefined}
          >
            Coming soon — tendencies will inform champion recommendations and draft suggestions.
          </p>
        </div>
      </Section>

      {/* ── Champion Recommendation ── */}
      <Section icon={<Sparkles className="h-4 w-4" />} title="Champion Recommendation" dm={dm}>
        <div
          className={`flex items-start gap-4 rounded-lg p-5 ${dm ? "" : "border border-dashed border-border"}`}
          style={dm ? { background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" } : undefined}
        >
          <Lightbulb
            className="mt-0.5 h-5 w-5 shrink-0"
            style={dm ? { color: "rgba(139,92,246,0.5)" } : undefined}
          />
          <div>
            <p
              className={`text-sm font-medium ${dm ? "" : "text-foreground"}`}
              style={dm ? { color: "rgba(255,255,255,0.7)" } : undefined}
            >
              Recommendations coming soon
            </p>
            <p
              className={`mt-1 text-xs ${dm ? "" : "text-muted-foreground"}`}
              style={dm ? { color: "rgba(255,255,255,0.35)" } : undefined}
            >
              Once your champion pool and match history are connected, we&apos;ll suggest new picks that
              complement your style and fill gaps in your team&apos;s composition.
            </p>
            <button
              disabled
              className={`mt-3 flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium cursor-not-allowed opacity-40 ${dm ? "" : "bg-primary/10 text-primary"}`}
              style={dm ? { background: "rgba(139,92,246,0.08)", color: "rgba(167,139,250,1)" } : undefined}
            >
              <ChevronRight className="h-3.5 w-3.5" />
              Generate recommendations
            </button>
          </div>
        </div>
      </Section>

      </div> {/* end constrained content */}
    </div>
  );
}
