"use client";

import { useAppDispatch, useAppSelector } from "../../app/redux";
import { setIsSidebarCollapsed } from "../../state";
import { useGetAuthUserQuery, useGetCompsQuery, useGetProfileQuery } from "../../state/api";
import { signOut } from "aws-amplify/auth";
import { Oxanium } from "next/font/google";
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  Home,
  LucideIcon,
  Search,
  User,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const oxanium = Oxanium({ subsets: ["latin"], weight: ["700", "800"] });

const Sidebar = () => {
  const dispatch           = useAppDispatch();
  const isSidebarCollapsed = useAppSelector((s: any) => s.global?.isSidebarCollapsed ?? false);
  const isDarkMode         = useAppSelector((s: any) => s.global?.isDarkMode ?? false);

  const { data: authData, isLoading: authLoading } = useGetAuthUserQuery(undefined);
  const { data: profile }                           = useGetProfileQuery();

  const displayName = profile?.displayName ?? authData?.user?.username ?? "—";

  const handleSignOut = async () => {
    try { await signOut(); } catch (e) { console.error(e); }
  };

  return (
    <div
      className={`fixed flex flex-col h-full justify-between transition-all duration-300 z-40
        overflow-y-auto overflow-x-hidden
        ${isSidebarCollapsed ? "w-0 overflow-hidden" : "w-64"}
        ${isDarkMode ? "" : "bg-card border-r border-border shadow-xl"}`}
      style={isDarkMode ? { background: "#0d0d14", borderRight: "1px solid rgba(255,255,255,0.06)" } : undefined}
    >
      <div className="flex h-full w-full flex-col justify-start">

        {/* Logo — w-full prevents overflow when scrollbar is present */}
        <div
          className={`flex min-h-14 w-full items-center justify-between px-6 pt-3 pb-2
            ${isDarkMode ? "" : "border-b border-border"}`}
          style={isDarkMode ? { borderBottom: "1px solid rgba(255,255,255,0.07)" } : undefined}
        >
          <div className={`${oxanium.className} text-base font-black uppercase tracking-tight select-none`}>
            {isDarkMode ? (
              <>
                <span style={{ color: "rgba(255,255,255,0.85)" }}>Team Comp </span>
                <span style={{
                  backgroundImage: "linear-gradient(90deg, rgba(139,92,246,1) 0%, rgba(167,139,250,1) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>Diff</span>
              </>
            ) : (
              <>
                <span className="text-foreground">Team Comp </span>
                <span className="text-primary">Diff</span>
              </>
            )}
          </div>
          <button
            className={`rounded p-1 transition-colors ${isDarkMode ? "" : "hover:bg-accent text-muted-foreground hover:text-foreground"}`}
            style={isDarkMode ? { color: "rgba(255,255,255,0.3)" } : undefined}
            onMouseEnter={isDarkMode ? (e) => { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; } : undefined}
            onMouseLeave={isDarkMode ? (e) => { e.currentTarget.style.color = "rgba(255,255,255,0.3)"; } : undefined}
            onClick={() => dispatch(setIsSidebarCollapsed(true))}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* User section */}
        <div
          className={`flex items-center gap-3 px-6 py-3 ${isDarkMode ? "" : "border-b border-border"}`}
          style={isDarkMode ? { borderBottom: "1px solid rgba(255,255,255,0.07)" } : undefined}
        >
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isDarkMode ? "" : "bg-primary/10"}`}
            style={isDarkMode ? { background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)" } : undefined}
          >
            <User
              className={`h-4 w-4 ${isDarkMode ? "" : "text-primary"}`}
              style={isDarkMode ? { color: "rgba(167,139,250,0.9)" } : undefined}
            />
          </div>
          {authLoading ? (
            <div
              className={`h-3 w-28 rounded animate-pulse ${isDarkMode ? "" : "bg-muted"}`}
              style={isDarkMode ? { background: "rgba(255,255,255,0.08)" } : undefined}
            />
          ) : (
            <span
              className={`text-sm font-medium truncate ${isDarkMode ? "" : "text-foreground"}`}
              style={isDarkMode ? { color: "rgba(255,255,255,0.6)" } : undefined}
            >
              {displayName}
            </span>
          )}
        </div>

        {/* Nav links */}
        <nav className="z-10 w-full mt-2">
          <SidebarLink icon={Home}   label="Team Generator"    href="/" isDarkMode={isDarkMode} />
          <TeamCompsNavItem isDarkMode={isDarkMode} />
          <SidebarLink icon={Users}  label="Draft"             href="/draft" isDarkMode={isDarkMode} />
          <SidebarLink icon={Search} label="Opponent Scouting" href="/scouting" isDarkMode={isDarkMode} />
          <SidebarLink icon={User}   label="Profile"           href="/profile" isDarkMode={isDarkMode} />
        </nav>
      </div>

      {/* Bottom sign-out (mobile) */}
      <div
        className={`flex w-full flex-col items-center gap-4 px-6 py-4 md:hidden ${isDarkMode ? "" : "border-t border-border"}`}
        style={isDarkMode ? { borderTop: "1px solid rgba(255,255,255,0.07)" } : undefined}
      >
        <div className="flex w-full items-center justify-between">
          <span
            className={`text-xs truncate ${isDarkMode ? "" : "text-foreground"}`}
            style={isDarkMode ? { color: "rgba(255,255,255,0.5)" } : undefined}
          >
            {displayName}
          </span>
          <button
            onClick={handleSignOut}
            className={`rounded px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-opacity hover:opacity-90 text-white
              ${isDarkMode ? "" : "bg-primary text-primary-foreground"}`}
            style={isDarkMode ? {
              background: "linear-gradient(135deg, rgba(139,92,246,1) 0%, rgba(99,60,220,1) 100%)",
              boxShadow: "0 0 12px rgba(139,92,246,0.3)",
            } : undefined}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Sidebar link ───────────────────────────────────────────────────────────

interface SidebarLinkProps {
  href: string;
  icon: LucideIcon;
  label: string;
  isDarkMode: boolean;
}

const SidebarLink = ({ href, icon: Icon, label, isDarkMode }: SidebarLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Link href={href} className="w-full">
      <div
        className={`relative flex cursor-pointer items-center gap-3 px-6 py-2.5 text-sm font-medium transition-all duration-150
          ${isDarkMode ? "" : (isActive
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground")}`}
        style={isDarkMode ? {
          background: isActive ? "rgba(139,92,246,0.1)" : "transparent",
          color: isActive ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.4)",
        } : undefined}
        onMouseEnter={isDarkMode ? (e) => {
          if (!isActive) {
            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
            e.currentTarget.style.color = "rgba(255,255,255,0.75)";
          }
        } : undefined}
        onMouseLeave={isDarkMode ? (e) => {
          if (!isActive) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "rgba(255,255,255,0.4)";
          }
        } : undefined}
      >
        {isActive && (
          <div className="absolute left-0 top-0 h-full w-0.5 rounded-r bg-primary" />
        )}
        <Icon className="h-4 w-4 shrink-0" />
        <span>{label}</span>
      </div>
    </Link>
  );
};

// ── Team comps nav item (expandable) ──────────────────────────────────────

const TeamCompsNavItem = ({ isDarkMode }: { isDarkMode: boolean }) => {
  const pathname = usePathname();
  const isActive = pathname === "/comps";
  const [isExpanded, setIsExpanded] = useState(isActive);

  const { data: compsData } = useGetCompsQuery();
  const comps = compsData?.comps ?? [];

  useEffect(() => {
    if (isActive) setIsExpanded(true);
  }, [isActive]);

  return (
    <div>
      <div
        className={`relative flex items-center text-sm font-medium transition-all duration-150
          ${isDarkMode ? "" : (isActive
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground")}`}
        style={isDarkMode ? {
          background: isActive ? "rgba(139,92,246,0.1)" : "transparent",
          color: isActive ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.4)",
        } : undefined}
        onMouseEnter={isDarkMode ? (e) => {
          if (!isActive) {
            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
            e.currentTarget.style.color = "rgba(255,255,255,0.75)";
          }
        } : undefined}
        onMouseLeave={isDarkMode ? (e) => {
          if (!isActive) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "rgba(255,255,255,0.4)";
          }
        } : undefined}
      >
        {isActive && (
          <div className="absolute left-0 top-0 h-full w-0.5 rounded-r bg-primary" />
        )}
        <Link href="/comps" className="flex flex-1 items-center gap-3 px-6 py-2.5 min-w-0">
          <BarChart3 className="h-4 w-4 shrink-0" />
          <span>Team Comps</span>
          {comps.length > 0 && (
            <span
              className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${isDarkMode ? "" : "bg-primary/10 text-primary"}`}
              style={isDarkMode ? {
                background: "rgba(139,92,246,0.2)",
                color: "rgba(167,139,250,0.9)",
                border: "1px solid rgba(139,92,246,0.3)",
              } : undefined}
            >
              {comps.length}
            </span>
          )}
        </Link>
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className={`pr-5 py-2.5 pl-1 shrink-0 transition-colors ${isDarkMode ? "" : "text-muted-foreground"}`}
          style={isDarkMode ? { color: "rgba(255,255,255,0.3)" } : undefined}
          aria-label="Toggle saved comps"
        >
          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className={`flex flex-col pb-1 ${isDarkMode ? "" : "bg-muted/30"}`}
          style={isDarkMode ? { background: "rgba(0,0,0,0.2)" } : undefined}
        >
          {comps.length === 0 ? (
            <p
              className={`py-1.5 pl-14 pr-6 text-xs ${isDarkMode ? "" : "text-muted-foreground/60"}`}
              style={isDarkMode ? { color: "rgba(255,255,255,0.2)" } : undefined}
            >
              No saved comps yet.
            </p>
          ) : (
            comps.map((comp) => (
              <Link
                key={comp.compId}
                href="/comps"
                className={`flex w-full items-center py-1.5 pl-14 pr-6 text-xs font-medium truncate transition-colors
                  ${isDarkMode ? "" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}
                style={isDarkMode ? { color: "rgba(139,92,246,0.6)" } : undefined}
                onMouseEnter={isDarkMode ? (e) => { e.currentTarget.style.color = "rgba(167,139,250,1)"; } : undefined}
                onMouseLeave={isDarkMode ? (e) => { e.currentTarget.style.color = "rgba(139,92,246,0.6)"; } : undefined}
              >
                {comp.compName}
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
