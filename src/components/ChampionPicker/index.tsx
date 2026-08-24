"use client";

import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "@/app/redux";
import { useGetChampionsQuery } from "@/state/api";
import { ALL_ROLES, ROLE_LABELS, type Role } from "@/lib/riot/types";
import { LayoutGrid, Search, X } from "lucide-react";

const DDRAGON_BASE = "https://ddragon.leagueoflegends.com/cdn/16.16.1/img/champion";

const CDRAG = "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions";

const ROLE_ICONS: Record<Role, string> = {
  top:     `${CDRAG}/icon-position-top.png`,
  jungle:  `${CDRAG}/icon-position-jungle.png`,
  mid:     `${CDRAG}/icon-position-middle.png`,
  adc:     `${CDRAG}/icon-position-bottom.png`,
  support: `${CDRAG}/icon-position-utility.png`,
  fill:    `${CDRAG}/icon-position-fill.png`,
};

// Base rgb values for role colors (used to build rgba strings at different opacities)
const ROLE_RGB: Record<Role, string> = {
  top:     "239,68,68",
  jungle:  "34,197,94",
  mid:     "139,92,246",
  adc:     "245,158,11",
  support: "59,130,246",
  fill:    "255,255,255",
};

interface ChampionPickerProps {
  selected: string[];
  onChange: (selected: string[]) => void;
  onClose: () => void;
  title?: string;
}

export default function ChampionPicker({
  selected,
  onChange,
  onClose,
  title = "Select Champions",
}: ChampionPickerProps) {
  const isDarkMode = useAppSelector((s: any) => s.global?.isDarkMode ?? false);

  const { data: champData, isLoading } = useGetChampionsQuery();
  const [roleFilter, setRoleFilter]    = useState<Role | "all">("all");
  const [search, setSearch]            = useState("");
  const searchRef                      = useRef<HTMLInputElement>(null);

  const champions = champData
    ? Object.entries(champData.data)
        .map(([id, data]) => ({
          id,
          name: data.name,
          roles: data.roles.map((r) => (r === "bot" ? "adc" : r)),
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];

  const filtered = champions.filter((c) => {
    if (roleFilter !== "all" && !c.roles.includes(roleFilter)) return false;
    if (search.length > 0 && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggle = (name: string) => {
    onChange(selected.includes(name) ? selected.filter((n) => n !== name) : [...selected, name]);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const dm = isDarkMode;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={onClose}
    >
      <div
        className={`relative flex flex-col w-full max-w-3xl h-[90vh] rounded-xl overflow-hidden shadow-2xl
          ${dm ? "" : "bg-card border border-border"}`}
        style={dm ? { background: "#0d0d14", border: "1px solid rgba(255,255,255,0.07)" } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 shrink-0 ${dm ? "" : "border-b border-border"}`}
          style={dm ? { borderBottom: "1px solid rgba(255,255,255,0.07)" } : undefined}
        >
          <div className="flex items-center gap-3">
            {roleFilter !== "all" && (
              <img src={ROLE_ICONS[roleFilter]} alt={roleFilter} className="h-5 w-5 object-contain opacity-80" />
            )}
            <h2 className={`text-sm font-black uppercase tracking-[0.2em] ${dm ? "text-white" : "text-foreground"}`}>
              {title}
            </h2>
            {selected.length > 0 && (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{
                  background: "rgba(139,92,246,0.15)",
                  color: dm ? "rgba(167,139,250,1)" : "rgba(109,40,217,1)",
                  border: "1px solid rgba(139,92,246,0.3)",
                }}
              >
                {selected.length} selected
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className={`rounded p-1.5 transition-colors ${dm ? "text-white/30 hover:text-white/80" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Role filters + search row */}
        <div
          className={`flex items-center gap-3 px-6 py-3 shrink-0 ${dm ? "" : "border-b border-border bg-muted/40"}`}
          style={dm ? { borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.3)" } : undefined}
        >
          {/* Role icon buttons */}
          <div className="flex items-center gap-1.5">
            {/* All */}
            <button
              onClick={() => setRoleFilter("all")}
              className={`relative flex h-9 w-9 items-center justify-center rounded transition-all duration-200
                ${!dm && roleFilter !== "all" ? "bg-muted border border-border hover:bg-accent" : ""}
                ${!dm && roleFilter === "all" ? "border" : ""}`}
              style={dm ? {
                background: roleFilter === "all" ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.04)",
                border: roleFilter === "all" ? "1px solid rgba(139,92,246,0.5)" : "1px solid rgba(255,255,255,0.07)",
                boxShadow: roleFilter === "all" ? "0 0 12px rgba(139,92,246,0.35)" : "none",
              } : roleFilter === "all" ? {
                background: "rgba(139,92,246,0.12)",
                borderColor: "rgba(139,92,246,0.4)",
              } : undefined}
            >
              <LayoutGrid
                className="h-4 w-4 transition-opacity"
                style={{ color: roleFilter === "all"
                  ? (dm ? "rgba(167,139,250,1)" : "rgba(109,40,217,1)")
                  : (dm ? "rgba(255,255,255,0.35)" : undefined) }}
                // In light mode, falls back to currentColor / muted
              />
            </button>

            {ALL_ROLES.map((role) => {
              const isActive = roleFilter === role;
              const rgb = ROLE_RGB[role];
              return (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  title={ROLE_LABELS[role]}
                  className={`relative flex h-9 w-9 items-center justify-center rounded transition-all duration-200
                    ${!dm && !isActive ? "bg-muted border border-border hover:bg-accent" : ""}`}
                  style={{
                    background: isActive ? `rgba(${rgb},0.15)` : (dm ? "rgba(255,255,255,0.04)" : undefined),
                    border: isActive ? `1px solid rgba(${rgb},0.5)` : (dm ? "1px solid rgba(255,255,255,0.07)" : undefined),
                    boxShadow: isActive && dm ? `0 0 12px rgba(${rgb},0.35)` : "none",
                  }}
                >
                  <img
                    src={ROLE_ICONS[role]}
                    alt={role}
                    className="h-5 w-5 object-contain transition-opacity"
                    style={{ opacity: isActive ? 1 : (dm ? 0.35 : 0.45) }}
                  />
                </button>
              );
            })}
          </div>

          {/* Active role label */}
          {roleFilter !== "all" && (
            <span
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: `rgba(${ROLE_RGB[roleFilter]},${dm ? "0.8" : "0.9"})` }}
            >
              {ROLE_LABELS[roleFilter]}
            </span>
          )}

          {/* Search */}
          <div className="relative ml-auto w-52">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none"
              style={{ color: dm ? "rgba(255,255,255,0.25)" : undefined }}
              // light mode: falls back to text-muted-foreground via Tailwind
            />
            <input
              ref={searchRef}
              autoFocus
              type="text"
              placeholder="Search champions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full rounded pl-8 pr-3 py-1.5 text-xs focus:outline-none
                ${dm
                  ? "text-white placeholder:text-white/25"
                  : "text-foreground placeholder:text-muted-foreground bg-background border border-input focus:ring-1 focus:ring-ring"}`}
              style={dm ? {
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
              } : undefined}
              onFocus={dm ? (e) => { e.currentTarget.style.borderColor = "rgba(139,92,246,0.5)"; } : undefined}
              onBlur={dm ? (e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; } : undefined}
            />
          </div>
        </div>

        {/* Champion grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className={`flex items-center justify-center py-20 text-sm ${dm ? "" : "text-muted-foreground"}`}
              style={dm ? { color: "rgba(255,255,255,0.3)" } : undefined}>
              Loading champions…
            </div>
          ) : filtered.length === 0 ? (
            <div className={`flex items-center justify-center py-20 text-sm ${dm ? "" : "text-muted-foreground"}`}
              style={dm ? { color: "rgba(255,255,255,0.3)" } : undefined}>
              No champions match.
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-1.5">
              {filtered.map((champ) => {
                const isSelected = selected.includes(champ.name);
                return (
                  <button
                    key={champ.id}
                    onClick={() => toggle(champ.name)}
                    className={`group flex flex-col items-center gap-1.5 rounded p-1.5 text-center transition-all duration-150
                      ${isSelected
                        ? "bg-primary/10 ring-2 ring-primary/50"
                        : dm ? "" : "hover:bg-accent"}`}
                    style={dm ? {
                      background: isSelected ? "rgba(139,92,246,0.15)" : "transparent",
                      border: isSelected ? "1px solid rgba(139,92,246,0.45)" : "1px solid transparent",
                    } : undefined}
                    onMouseEnter={dm && !isSelected ? (e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                      e.currentTarget.style.border = "1px solid rgba(255,255,255,0.1)";
                    } : undefined}
                    onMouseLeave={dm && !isSelected ? (e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.border = "1px solid transparent";
                    } : undefined}
                  >
                    <div className="relative w-full aspect-square overflow-hidden rounded-sm">
                      <img
                        src={`${DDRAGON_BASE}/${champ.id}.png`}
                        alt={champ.name}
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-110"
                        loading="lazy"
                      />
                      {isSelected && (
                        <div
                          className="absolute inset-0 flex items-end justify-end p-1"
                          style={{ background: "rgba(139,92,246,0.25)" }}
                        >
                          <div
                            className="flex h-4 w-4 items-center justify-center rounded-full bg-primary"
                            style={dm ? { boxShadow: "0 0 6px rgba(139,92,246,0.8)" } : undefined}
                          >
                            <svg viewBox="0 0 10 8" className="h-2 w-2">
                              <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                    <span
                      className={`w-full truncate text-[9px] font-bold uppercase tracking-wider leading-none
                        ${isSelected ? "text-primary" : dm ? "" : "text-muted-foreground"}`}
                      style={dm && !isSelected ? { color: "rgba(255,255,255,0.5)" } : undefined}
                    >
                      {champ.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`flex items-center justify-between px-6 py-3 shrink-0 ${dm ? "" : "border-t border-border bg-muted/30"}`}
          style={dm ? { borderTop: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.3)" } : undefined}
        >
          <button
            onClick={() => onChange([])}
            disabled={selected.length === 0}
            className={`text-xs font-medium uppercase tracking-wider transition-colors disabled:opacity-30
              ${dm ? "" : "text-muted-foreground hover:text-destructive"}`}
            style={dm ? { color: "rgba(255,255,255,0.35)" } : undefined}
            onMouseEnter={dm ? (e) => { if (selected.length > 0) e.currentTarget.style.color = "rgba(239,68,68,0.8)"; } : undefined}
            onMouseLeave={dm ? (e) => { e.currentTarget.style.color = "rgba(255,255,255,0.35)"; } : undefined}
          >
            Clear all
          </button>
          <button
            onClick={onClose}
            className={`rounded px-5 py-2 text-xs font-black uppercase tracking-widest transition-opacity hover:opacity-90
              ${dm ? "text-white" : "bg-primary text-primary-foreground"}`}
            style={dm ? {
              background: "linear-gradient(135deg, rgba(139,92,246,1) 0%, rgba(99,60,220,1) 100%)",
              boxShadow: "0 0 20px rgba(139,92,246,0.4)",
            } : undefined}
          >
            Confirm · {selected.length}
          </button>
        </div>
      </div>
    </div>
  );
}
