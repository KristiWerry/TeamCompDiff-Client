"use client";

import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/redux";
import {
  clearSlot,
  setSummonerData,
  setSlotRole,
  setSlotSecondaryRole,
  setSlotChampPool,
} from "@/state/teamSlice";
import { useGetProfileQuery } from "@/state/api";
import type { Role } from "@/lib/riot/types";
import { ALL_ROLES, ROLE_LABELS } from "@/lib/riot/types";
import ChampionPicker from "@/components/ChampionPicker";
import { Plus, User, X } from "lucide-react";

const CDRAG = "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions";

const ROLE_ICONS: Partial<Record<Role, string>> = {
  top:     `${CDRAG}/icon-position-top.png`,
  jungle:  `${CDRAG}/icon-position-jungle.png`,
  mid:     `${CDRAG}/icon-position-middle.png`,
  adc:     `${CDRAG}/icon-position-bottom.png`,
  support: `${CDRAG}/icon-position-utility.png`,
  fill:    `${CDRAG}/icon-position-fill.png`,
};

const ROLE_GLOW: Partial<Record<Role, string>> = {
  top:     "rgba(239,68,68,0.35)",
  jungle:  "rgba(34,197,94,0.35)",
  mid:     "rgba(139,92,246,0.45)",
  adc:     "rgba(245,158,11,0.35)",
  support: "rgba(59,130,246,0.35)",
  fill:    "rgba(255,255,255,0.2)",
};

const ROLE_BG: Partial<Record<Role, string>> = {
  top:     "rgba(239,68,68,0.15)",
  jungle:  "rgba(34,197,94,0.15)",
  mid:     "rgba(139,92,246,0.15)",
  adc:     "rgba(245,158,11,0.15)",
  support: "rgba(59,130,246,0.15)",
  fill:    "rgba(255,255,255,0.08)",
};

const ROLE_BORDER: Partial<Record<Role, string>> = {
  top:     "rgba(239,68,68,0.45)",
  jungle:  "rgba(34,197,94,0.45)",
  mid:     "rgba(139,92,246,0.5)",
  adc:     "rgba(245,158,11,0.45)",
  support: "rgba(59,130,246,0.45)",
  fill:    "rgba(255,255,255,0.3)",
};

// ── Role icon row ─────────────────────────────────────────────────────────

function RoleIconRow({
  label, value, exclude, onChange, dm,
}: {
  label: string;
  value: Role | undefined;
  exclude?: Role;
  onChange: (r: Role | undefined) => void;
  dm: boolean;
}) {
  return (
    <div>
      <p
        className={`mb-2 text-[10px] font-bold uppercase tracking-widest ${dm ? "" : "text-muted-foreground"}`}
        style={dm ? { color: "rgba(255,255,255,0.35)" } : undefined}
      >
        {label}
      </p>
      <div className="flex gap-1.5">
        <button
          onClick={() => onChange(undefined)}
          title="None"
          className={`flex h-9 w-9 items-center justify-center rounded transition-all duration-150
            ${!dm ? (!value ? "bg-muted border-2 border-border" : "bg-muted border border-border hover:bg-accent") : ""}`}
          style={dm ? {
            background: !value ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)",
            border: !value ? "1px solid rgba(255,255,255,0.25)" : "1px solid rgba(255,255,255,0.07)",
          } : undefined}
        >
          <span
            className={`text-xs font-bold ${dm ? "" : "text-muted-foreground"}`}
            style={dm ? { color: "rgba(255,255,255,0.4)" } : undefined}
          >
            —
          </span>
        </button>
        {([...ALL_ROLES, "fill"] as Role[]).filter((r) => r !== exclude).map((role) => {
          const isActive = value === role;
          return (
            <button
              key={role}
              onClick={() => onChange(role)}
              title={ROLE_LABELS[role]}
              className={`flex h-9 w-9 items-center justify-center rounded transition-all duration-150
                ${!dm && !isActive ? "bg-muted border border-border hover:bg-accent" : ""}
                ${!dm && isActive ? "border-2" : ""}`}
              style={dm ? {
                background: isActive ? ROLE_BG[role] : "rgba(255,255,255,0.03)",
                border: isActive ? `1px solid ${ROLE_BORDER[role]}` : "1px solid rgba(255,255,255,0.07)",
                boxShadow: isActive ? `0 0 10px ${ROLE_GLOW[role]}` : "none",
              } : isActive ? {
                background: ROLE_BG[role],
                borderColor: ROLE_BORDER[role],
              } : undefined}
            >
              {ROLE_ICONS[role] && (
                <img
                  src={ROLE_ICONS[role]}
                  alt={role}
                  className="h-5 w-5 object-contain transition-opacity duration-150"
                  style={{ opacity: isActive ? 1 : (dm ? 0.35 : 0.65) }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Slot config modal ─────────────────────────────────────────────────────

function SlotConfigModal({ slotIndex, onClose }: { slotIndex: number; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const slot = useAppSelector((s: any) => s.team?.slots?.[slotIndex]) as any;
  const myRiotId = useAppSelector((s: any) => s.team?.myRiotId as string | null);
  const dm = useAppSelector((s: any) => s.global?.isDarkMode ?? false);
  const { data: profile } = useGetProfileQuery();

  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const pool = (slot.slotChampPool ?? []) as string[];
  const hasPlayer = !!slot.gameName;

  const commitRiotId = (riotId: string) => {
    const [gameName, ...tagParts] = riotId.trim().split("#");
    const tagLine = tagParts.join("#");
    if (!gameName || !tagLine) { setInputError("Format: GameName#Tag"); return; }
    dispatch(setSummonerData({ slotIndex, data: { gameName, tagLine } }));
    setInput(""); setInputError("");
  };

  const handleAddMe = () => {
    if (!myRiotId) return;
    const [gameName, ...tagParts] = myRiotId.split("#");
    const tagLine = tagParts.join("#");
    dispatch(setSummonerData({ slotIndex, data: { gameName, tagLine: tagLine ?? "" } }));
    if (profile?.preferredRole) dispatch(setSlotRole({ slotIndex, role: profile.preferredRole }));
    if (profile?.preferredSecondaryRole) dispatch(setSlotSecondaryRole({ slotIndex, role: profile.preferredSecondaryRole }));
    if (profile?.champPool?.length) dispatch(setSlotChampPool({ slotIndex, pool: profile.champPool }));
  };

  const handleClear = () => { dispatch(clearSlot(slotIndex)); onClose(); };

  return (
    <>
      <div
        className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80"
        onClick={onClose}
      >
        <div
          className={`relative w-full max-w-sm rounded-xl overflow-hidden shadow-2xl
            ${dm ? "" : "bg-card border border-border"}`}
          style={dm ? { background: "#0d0d14", border: "1px solid rgba(255,255,255,0.07)" } : undefined}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between px-5 py-4 ${dm ? "" : "border-b border-border"}`}
            style={dm ? { borderBottom: "1px solid rgba(255,255,255,0.07)" } : undefined}
          >
            <h2
              className={`text-sm font-black uppercase tracking-[0.2em] ${dm ? "text-white" : "text-foreground"}`}
            >
              Configure Slot
            </h2>
            <div className="flex items-center gap-3">
              {(slot.primaryRole || pool.length > 0 || slot.gameName) && (
                <button
                  onClick={handleClear}
                  className={`text-[10px] uppercase tracking-wider transition-colors ${dm ? "" : "text-muted-foreground hover:text-destructive"}`}
                  style={dm ? { color: "rgba(255,255,255,0.3)" } : undefined}
                  onMouseEnter={dm ? (e) => { e.currentTarget.style.color = "rgba(239,68,68,0.8)"; } : undefined}
                  onMouseLeave={dm ? (e) => { e.currentTarget.style.color = "rgba(255,255,255,0.3)"; } : undefined}
                >
                  Clear
                </button>
              )}
              <button
                onClick={onClose}
                className={`rounded p-1 transition-colors ${dm ? "" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}
                style={dm ? { color: "rgba(255,255,255,0.3)" } : undefined}
                onMouseEnter={dm ? (e) => { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; } : undefined}
                onMouseLeave={dm ? (e) => { e.currentTarget.style.color = "rgba(255,255,255,0.3)"; } : undefined}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Riot account — top, optional */}
            <div>
              <div className="flex items-baseline gap-2 mb-1">
                <p
                  className={`text-[10px] font-bold uppercase tracking-widest ${dm ? "" : "text-muted-foreground"}`}
                  style={dm ? { color: "rgba(255,255,255,0.35)" } : undefined}
                >
                  Riot Account
                </p>
                <span
                  className={`text-[9px] italic ${dm ? "" : "text-muted-foreground/50"}`}
                  style={dm ? { color: "rgba(255,255,255,0.2)" } : undefined}
                >
                  *optional
                </span>
              </div>
              <p
                className={`mb-3 text-[10px] leading-relaxed ${dm ? "" : "text-muted-foreground/70"}`}
                style={dm ? { color: "rgba(255,255,255,0.3)" } : undefined}
              >
                Link a Riot ID to automatically pull this player&apos;s champion pool and preferred roles into the slot.
              </p>
              {hasPlayer ? (
                <div
                  className={`flex items-center justify-between rounded px-3 py-2 ${dm ? "" : "bg-primary/5 border border-primary/20"}`}
                  style={dm ? { background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" } : undefined}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full ${dm ? "" : "bg-primary/10 border border-primary/30"}`}
                      style={dm ? { background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.4)" } : undefined}
                    >
                      <User
                        className={`h-3 w-3 ${dm ? "" : "text-primary"}`}
                        style={dm ? { color: "rgba(167,139,250,0.9)" } : undefined}
                      />
                    </div>
                    <span
                      className={`text-xs truncate ${dm ? "" : "text-foreground"}`}
                      style={dm ? { color: "rgba(255,255,255,0.6)" } : undefined}
                    >
                      {slot.gameName}
                      <span
                        className={dm ? "" : "text-muted-foreground/50"}
                        style={dm ? { opacity: 0.4 } : undefined}
                      >
                        #{slot.tagLine}
                      </span>
                    </span>
                  </div>
                  <button
                    onClick={() => dispatch(setSummonerData({ slotIndex, data: { gameName: "", tagLine: "" } }))}
                    className={`ml-2 shrink-0 text-[10px] uppercase tracking-wider transition-colors ${dm ? "" : "text-muted-foreground hover:text-destructive"}`}
                    style={dm ? { color: "rgba(255,255,255,0.25)" } : undefined}
                    onMouseEnter={dm ? (e) => { e.currentTarget.style.color = "rgba(239,68,68,0.7)"; } : undefined}
                    onMouseLeave={dm ? (e) => { e.currentTarget.style.color = "rgba(255,255,255,0.25)"; } : undefined}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <form onSubmit={(e) => { e.preventDefault(); commitRiotId(input); }} className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="GameName#Tag"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className={`min-w-0 flex-1 rounded px-2 py-1.5 text-xs focus:outline-none
                        ${dm
                          ? "text-white placeholder:text-white/20"
                          : "text-foreground placeholder:text-muted-foreground bg-background border border-input focus:ring-1 focus:ring-ring"}`}
                      style={dm ? { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" } : undefined}
                      onFocus={dm ? (e) => { e.currentTarget.style.borderColor = "rgba(139,92,246,0.5)"; } : undefined}
                      onBlur={dm ? (e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; } : undefined}
                    />
                    <button
                      type="submit"
                      disabled={!input.trim()}
                      className={`shrink-0 rounded px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-opacity disabled:opacity-30
                        ${dm ? "" : "bg-primary/10 border border-primary/25 text-primary hover:bg-primary/20"}`}
                      style={dm ? {
                        background: "rgba(139,92,246,0.15)",
                        border: "1px solid rgba(139,92,246,0.3)",
                        color: "rgba(167,139,250,0.9)",
                      } : undefined}
                    >
                      Link
                    </button>
                  </form>
                  {inputError && <p className="text-xs text-destructive">{inputError}</p>}
                  {myRiotId && (
                    <button
                      onClick={handleAddMe}
                      className={`flex items-center gap-1 text-[10px] transition-colors ${dm ? "" : "text-muted-foreground hover:text-foreground"}`}
                      style={dm ? { color: "rgba(255,255,255,0.25)" } : undefined}
                      onMouseEnter={dm ? (e) => { e.currentTarget.style.color = "rgba(255,255,255,0.6)"; } : undefined}
                      onMouseLeave={dm ? (e) => { e.currentTarget.style.color = "rgba(255,255,255,0.25)"; } : undefined}
                    >
                      <User className="h-3 w-3" />
                      Use my account ({myRiotId})
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Primary role */}
            <div
              className={`${dm ? "" : "border-t border-border"} pt-5`}
              style={dm ? { borderTop: "1px solid rgba(255,255,255,0.07)" } : undefined}
            >
              <RoleIconRow
                label="Primary Role"
                value={slot.primaryRole}
                exclude={slot.secondaryRole}
                onChange={(r) => dispatch(setSlotRole({ slotIndex, role: r }))}
                dm={dm}
              />
            </div>

            {/* Secondary role — hidden when fill is primary */}
            {slot.primaryRole !== "fill" && (
              <RoleIconRow
                label="Secondary Role"
                value={slot.secondaryRole}
                exclude={slot.primaryRole}
                onChange={(r) => dispatch(setSlotSecondaryRole({ slotIndex, role: r }))}
                dm={dm}
              />
            )}

            {/* Champion pool */}
            <div
              className={`${dm ? "" : "border-t border-border"} pt-5`}
              style={dm ? { borderTop: "1px solid rgba(255,255,255,0.07)" } : undefined}
            >
              <div className="flex items-center justify-between mb-2.5">
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest ${dm ? "" : "text-muted-foreground"}`}
                  style={dm ? { color: "rgba(255,255,255,0.35)" } : undefined}
                >
                  Champion Pool
                </span>
                <button
                  onClick={() => setPickerOpen(true)}
                  className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${dm ? "" : "text-primary hover:text-primary/70"}`}
                  style={dm ? { color: "rgba(139,92,246,0.8)" } : undefined}
                  onMouseEnter={dm ? (e) => { e.currentTarget.style.color = "rgba(167,139,250,1)"; } : undefined}
                  onMouseLeave={dm ? (e) => { e.currentTarget.style.color = "rgba(139,92,246,0.8)"; } : undefined}
                >
                  {pool.length > 0 ? `Change Pool · ${pool.length}` : "+ Select Champions"}
                </button>
              </div>
              {pool.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {pool.slice(0, 8).map((c) => (
                    <span
                      key={c}
                      className={`rounded px-2 py-0.5 text-[10px] font-medium ${dm ? "" : "bg-primary/10 border border-primary/20 text-primary"}`}
                      style={dm ? {
                        background: "rgba(139,92,246,0.12)",
                        border: "1px solid rgba(139,92,246,0.25)",
                        color: "rgba(167,139,250,0.9)",
                      } : undefined}
                    >
                      {c}
                    </span>
                  ))}
                  {pool.length > 8 && (
                    <span
                      className={`text-[10px] ${dm ? "" : "text-muted-foreground"}`}
                      style={dm ? { color: "rgba(255,255,255,0.3)" } : undefined}
                    >
                      +{pool.length - 8} more
                    </span>
                  )}
                </div>
              ) : (
                <p
                  className={`text-[10px] ${dm ? "" : "text-muted-foreground/50"}`}
                  style={dm ? { color: "rgba(255,255,255,0.25)" } : undefined}
                >
                  No pool set — uses profile pool if available.
                </p>
              )}
            </div>
          </div>

          <div className="px-5 pb-5">
            <button
              onClick={onClose}
              className={`w-full rounded-lg py-2.5 text-sm font-black uppercase tracking-widest transition-opacity hover:opacity-90
                ${dm ? "text-white" : "bg-primary text-primary-foreground"}`}
              style={dm ? {
                background: "linear-gradient(135deg, rgba(139,92,246,1) 0%, rgba(99,60,220,1) 100%)",
                boxShadow: "0 0 20px rgba(139,92,246,0.35)",
              } : undefined}
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {pickerOpen && (
        <ChampionPicker
          selected={pool}
          onChange={(next) => dispatch(setSlotChampPool({ slotIndex, pool: next }))}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────

export default function SummonerCard({ slotIndex }: { slotIndex: number }) {
  const slot = useAppSelector((s: any) => s.team?.slots?.[slotIndex]) as any;
  const champions = useAppSelector((s: any) => s.team?.champions ?? {}) as Record<string, any>;
  const [modalOpen, setModalOpen] = useState(false);

  const pool = (slot.slotChampPool ?? []) as string[];
  const role = slot.primaryRole as Role | undefined;
  const isConfigured = !!(role || pool.length > 0 || slot.gameName);

  // Resolve DDragon IDs → champion splashes (1 / 2 / 4 based on pool size)
  const nameToId = Object.fromEntries(
    Object.entries(champions).map(([id, d]: [string, any]) => [d.name, id])
  );
  const imageCount = pool.length === 0 ? 0 : pool.length === 1 ? 1 : pool.length <= 3 ? 2 : 4;
  const splashIds = pool.slice(0, imageCount).map((n) => nameToId[n]).filter(Boolean) as string[];

  const secondaryRole = slot.secondaryRole as Role | undefined;
  const roleIcon = role ? ROLE_ICONS[role] : null;
  const glow = role ? ROLE_GLOW[role] : "rgba(139,92,246,0.35)";

  return (
    <>
      <div className="flex flex-col gap-2">
        {/* Label above card */}
        <div className="flex flex-col gap-0.5 min-h-11 justify-center">
          {roleIcon ? (
            <>
              <div className="flex items-center gap-2">
                <img src={roleIcon} alt={role} className="h-5 w-5 shrink-0 object-contain opacity-90" />
                <span className="text-sm font-bold uppercase tracking-wider text-foreground whitespace-nowrap">
                  {ROLE_LABELS[role!]}
                </span>
              </div>
              {role !== "fill" && secondaryRole && ROLE_ICONS[secondaryRole] && (
                <div className="flex items-center gap-1.5 pl-0.5">
                  <img
                    src={ROLE_ICONS[secondaryRole]}
                    alt={secondaryRole}
                    className="h-3.5 w-3.5 shrink-0 object-contain opacity-50"
                  />
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 whitespace-nowrap">
                    {ROLE_LABELS[secondaryRole]}
                  </span>
                </div>
              )}
            </>
          ) : (
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/30">
              Slot {slotIndex + 1}
            </span>
          )}
        </div>

        {/* Card */}
        {isConfigured ? (
          <button
            onClick={() => setModalOpen(true)}
            className="group relative w-full overflow-hidden rounded-xl aspect-3/4 text-left transition-all duration-300 hover:scale-[1.03]"
            style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.06)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 30px ${glow}, 0 0 0 1px rgba(255,255,255,0.1)`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 0 1px rgba(255,255,255,0.06)";
            }}
          >
            {/* Background splashes */}
            {splashIds.length === 0 ? (
              <div className="absolute inset-0 bg-zinc-900" />
            ) : splashIds.length === 1 ? (
              <img
                src={`https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${splashIds[0]}_0.jpg`}
                alt={pool[0]}
                className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
              />
            ) : splashIds.length === 2 ? (
              <div className="absolute inset-0 flex">
                {splashIds.map((id, i) => (
                  <div key={id} className="relative flex-1 overflow-hidden">
                    <img
                      src={`https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${id}_0.jpg`}
                      alt={pool[i]}
                      className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                {splashIds.map((id, i) => (
                  <div key={id} className="relative overflow-hidden">
                    <img
                      src={`https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${id}_0.jpg`}
                      alt={pool[i]}
                      className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/20 to-black/50" />

            {/* Role icon large (when no splash) */}
            {splashIds.length === 0 && roleIcon && (
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src={roleIcon}
                  alt={role}
                  className="h-20 w-20 object-contain opacity-10 transition-opacity duration-300 group-hover:opacity-20"
                />
              </div>
            )}

            {/* Bottom content */}
            {/* Bottom content */}
            <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1">
              {slot.gameName ? (
                <div className="flex items-center gap-1.5">
                  <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/30 ring-1 ring-primary/50">
                    <User className="h-2.5 w-2.5 text-primary" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-white truncate leading-none">
                    {slot.gameName}
                  </span>
                </div>
              ) : pool.length > 0 ? (
                <div className="space-y-0.5">
                  {pool.slice(0, 3).map((c, i) => (
                    <p
                      key={c}
                      className="truncate uppercase tracking-wide leading-none"
                      style={{
                        fontSize: i === 0 ? "10px" : "9px",
                        color: i === 0 ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.35)",
                        fontWeight: i === 0 ? 700 : 400,
                      }}
                    >
                      {c}
                    </p>
                  ))}
                  {pool.length > 3 && (
                    <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                      +{pool.length - 3} more
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          </button>
        ) : (
          <button
            onClick={() => setModalOpen(true)}
            className="group relative w-full overflow-hidden rounded-xl border-2 border-dashed border-zinc-700/60
              bg-zinc-900/40 aspect-3/4 transition-all duration-300
              hover:border-primary/50 hover:bg-zinc-800/40 hover:scale-[1.03]
              hover:shadow-[0_0_25px_rgba(139,92,246,0.2)]"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <Plus
                className="h-8 w-8 text-zinc-600 transition-all duration-300
                  group-hover:text-primary/50 group-hover:scale-125 group-hover:rotate-90"
              />
            </div>
          </button>
        )}
      </div>

      {modalOpen && (
        <SlotConfigModal slotIndex={slotIndex} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}
