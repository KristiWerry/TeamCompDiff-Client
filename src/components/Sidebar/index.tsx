"use client";

import { useAppDispatch, useAppSelector } from "../../app/redux";
import { setIsDarkMode, setIsSidebarCollapsed } from "../../state";
import { useGetAuthUserQuery, useGetCompsQuery, useGetProfileQuery, useGetQueriesQuery } from "../../state/api";
import { signOut } from "aws-amplify/auth";
import { Oxanium } from "next/font/google";
import {
  BarChart3,
  Bookmark,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Home,
  LogOut,
  LucideIcon,
  Menu,
  Moon,
  Search,
  Sun,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const oxanium = Oxanium({ subsets: ["latin"], weight: ["700", "800"] });

// ── Queries nav item (expandable in full mode, icon+tooltip in mini) ─────────

const QueriesNavItem = ({ dm, mini }: { dm: boolean; mini: boolean }) => {
  const pathname = usePathname();
  const isActive = pathname === "/queries" || pathname.startsWith("/queries/");
  const [isExpanded, setIsExpanded] = useState(isActive);

  const { data: queriesData } = useGetQueriesQuery();
  const queries = queriesData?.queries ?? [];

  useEffect(() => {
    if (isActive) setIsExpanded(true);
  }, [isActive]);

  if (mini) {
    return (
      <Link href="/queries" className="group w-full">
        <div
          className={`relative flex cursor-pointer items-center justify-center py-3 text-sm font-medium transition-all duration-150
            ${dm ? "" : (isActive
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground")}`}
          style={dm ? {
            background: isActive ? "rgba(139,92,246,0.1)" : "transparent",
            color: isActive ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.4)",
          } : undefined}
          onMouseEnter={dm ? (e) => {
            if (!isActive) {
              e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              e.currentTarget.style.color = "rgba(255,255,255,0.75)";
            }
          } : undefined}
          onMouseLeave={dm ? (e) => {
            if (!isActive) {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "rgba(255,255,255,0.4)";
            }
          } : undefined}
        >
          <Bookmark className="h-4 w-4 shrink-0" />
          <span
            className={`pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md px-2.5 py-1.5
              text-xs font-medium opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-150 z-50
              ${dm ? "" : "bg-popover text-popover-foreground border border-border shadow-md"}`}
            style={dm ? {
              background: "#17161E",
              color: "rgba(255,255,255,0.85)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            } : undefined}
          >
            Queries
          </span>
        </div>
      </Link>
    );
  }

  return (
    <div>
      <div
        className={`relative flex items-center text-sm font-medium transition-all duration-150
          ${dm ? "" : (isActive
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground")}`}
        style={dm ? {
          background: isActive ? "rgba(139,92,246,0.1)" : "transparent",
          color: isActive ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.4)",
        } : undefined}
        onMouseEnter={dm ? (e) => {
          if (!isActive) {
            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
            e.currentTarget.style.color = "rgba(255,255,255,0.75)";
          }
        } : undefined}
        onMouseLeave={dm ? (e) => {
          if (!isActive) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "rgba(255,255,255,0.4)";
          }
        } : undefined}
      >
        {isActive && (
          <div className="absolute left-0 top-0 h-full w-0.5 rounded-r bg-primary" />
        )}
        <Link href="/queries" className="flex flex-1 items-center gap-3 px-6 py-2.5 min-w-0">
          <Bookmark className="h-4 w-4 shrink-0" />
          <span>Queries</span>
          {queries.length > 0 && (
            <span
              className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${dm ? "" : "bg-primary/10 text-primary"}`}
              style={dm ? {
                background: "rgba(139,92,246,0.2)",
                color: "rgba(167,139,250,0.9)",
                border: "1px solid rgba(139,92,246,0.3)",
              } : undefined}
            >
              {queries.length}
            </span>
          )}
        </Link>
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className={`pr-5 py-2.5 pl-1 shrink-0 transition-colors ${dm ? "" : "text-muted-foreground"}`}
          style={dm ? { color: "rgba(255,255,255,0.3)" } : undefined}
          aria-label="Toggle saved queries"
        >
          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div
          className={`flex flex-col pb-1 ${dm ? "" : "bg-muted/30"}`}
          style={dm ? { background: "rgba(0,0,0,0.2)" } : undefined}
        >
          {queries.length === 0 ? (
            <p
              className={`py-1.5 pl-14 pr-6 text-xs ${dm ? "" : "text-muted-foreground/60"}`}
              style={dm ? { color: "rgba(255,255,255,0.2)" } : undefined}
            >
              No saved queries yet.
            </p>
          ) : (
            queries.map((query) => {
              const queryActive = pathname === `/queries/${query.queryId}`;
              return (
                <Link
                  key={query.queryId}
                  href={`/queries/${query.queryId}`}
                  className={`flex w-full items-center py-1.5 pl-14 pr-6 text-xs font-medium truncate transition-colors
                    ${dm ? "" : (queryActive
                      ? "text-foreground bg-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent")}`}
                  style={dm ? { color: queryActive ? "rgba(167,139,250,1)" : "rgba(139,92,246,0.6)" } : undefined}
                  onMouseEnter={dm ? (e) => { e.currentTarget.style.color = "rgba(167,139,250,1)"; } : undefined}
                  onMouseLeave={dm ? (e) => { e.currentTarget.style.color = queryActive ? "rgba(167,139,250,1)" : "rgba(139,92,246,0.6)"; } : undefined}
                >
                  {query.queryName}
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

// ── Sidebar ───────────────────────────────────────────────────────────────────

const Sidebar = () => {
  const dispatch = useAppDispatch();
  const mini     = useAppSelector((s: any) => s.global?.isSidebarCollapsed ?? false);
  const dm       = useAppSelector((s: any) => s.global?.isDarkMode ?? false);

  const { data: authData } = useGetAuthUserQuery(undefined);
  const { data: profile }  = useGetProfileQuery();

  const displayName = profile?.displayName ?? authData?.user?.username ?? "—";

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = async () => {
    setProfileOpen(false);
    try { await signOut(); } catch (e) { console.error(e); }
  };

  return (
    <div
      className={`fixed flex flex-col h-full justify-between transition-all duration-300 z-40
        ${mini ? "w-14" : "w-64 overflow-y-auto overflow-x-hidden"}
        ${dm ? "" : "bg-card border-r border-border shadow-xl"}`}
      style={dm ? { background: "#0d0d14", borderRight: "1px solid rgba(255,255,255,0.06)" } : undefined}
    >
      {/* ── Top content ─────────────────────────────────────────────── */}
      <div className="flex w-full flex-col">

        {/* Header */}
        <div
          className={`flex w-full min-h-14 pt-3 pb-2 items-center
            ${mini ? "flex-col justify-center gap-1 px-3" : "justify-between px-6"}
            ${dm ? "" : "border-b border-border"}`}
          style={dm ? { borderBottom: "1px solid rgba(255,255,255,0.07)" } : undefined}
        >
          {mini ? (
            <>
              <button
                onClick={() => dispatch(setIsSidebarCollapsed(false))}
                className={`flex h-8 w-8 items-center justify-center rounded transition-colors
                  ${dm ? "" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
                style={dm ? { color: "rgba(255,255,255,0.4)" } : undefined}
                onMouseEnter={dm ? (e) => { e.currentTarget.style.color = "rgba(255,255,255,0.85)"; } : undefined}
                onMouseLeave={dm ? (e) => { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; } : undefined}
                title="Expand sidebar"
              >
                <Menu className="h-4 w-4" />
              </button>
              <span
                className={`${oxanium.className} text-[10px] font-black uppercase tracking-tight select-none
                  ${dm ? "" : "text-primary"}`}
                style={dm ? {
                  backgroundImage: "linear-gradient(90deg, rgba(139,92,246,1) 0%, rgba(167,139,250,1) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                } : undefined}
              >
                TCD
              </span>
            </>
          ) : (
            <>
              <div className={`${oxanium.className} text-base font-black uppercase tracking-tight select-none`}>
                {dm ? (
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
                onClick={() => dispatch(setIsSidebarCollapsed(true))}
                className={`flex h-7 w-7 items-center justify-center rounded transition-colors
                  ${dm ? "" : "border border-border text-muted-foreground hover:bg-accent hover:text-foreground"}`}
                style={dm ? {
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.35)",
                } : undefined}
                onMouseEnter={dm ? (e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.75)";
                } : undefined}
                onMouseLeave={dm ? (e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.35)";
                } : undefined}
                title="Collapse sidebar"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>

        {/* Nav */}
        <nav className="z-10 w-full mt-2">
          <SidebarLink icon={Home}   label="Team Generator"    href="/"         dm={dm} mini={mini} />
          <TeamCompsNavItem dm={dm} mini={mini} />
          <QueriesNavItem dm={dm} mini={mini} />
          <SidebarLink icon={Users}  label="Draft"             href="/draft"    dm={dm} mini={mini} />
          <SidebarLink icon={Search} label="Opponent Scouting" href="/scouting" dm={dm} mini={mini} />
          <SidebarLink icon={User}   label="Profile"           href="/profile"  dm={dm} mini={mini} />
        </nav>
      </div>

      {/* ── Profile / bottom ────────────────────────────────────────── */}
      <div
        className={`relative w-full ${dm ? "" : "border-t border-border"}`}
        style={dm ? { borderTop: "1px solid rgba(255,255,255,0.07)" } : undefined}
        ref={profileRef}
      >
        {/* Dropdown */}
        {profileOpen && (
          <div
            className={`absolute z-50 rounded-lg overflow-hidden
              ${mini ? "left-full ml-2 bottom-0 w-44" : "bottom-full left-4 right-4 mb-2"}
              ${dm ? "" : "bg-card border border-border shadow-xl"}`}
            style={dm ? {
              background: "#17161E",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            } : undefined}
          >
            <button
              onClick={() => dispatch(setIsDarkMode(!dm))}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors
                ${dm ? "" : "text-foreground hover:bg-accent"}`}
              style={dm ? { color: "rgba(255,255,255,0.75)" } : undefined}
              onMouseEnter={dm ? (e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; } : undefined}
              onMouseLeave={dm ? (e) => { e.currentTarget.style.background = "transparent"; } : undefined}
            >
              {dm ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
              <span>{dm ? "Light mode" : "Dark mode"}</span>
            </button>

            <div
              className={`mx-3 h-px ${dm ? "" : "bg-border"}`}
              style={dm ? { background: "rgba(255,255,255,0.07)" } : undefined}
            />

            <button
              onClick={handleSignOut}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors
                ${dm ? "" : "text-destructive hover:bg-accent"}`}
              style={dm ? { color: "rgba(239,68,68,0.8)" } : undefined}
              onMouseEnter={dm ? (e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.08)";
                e.currentTarget.style.color = "rgba(239,68,68,1)";
              } : undefined}
              onMouseLeave={dm ? (e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "rgba(239,68,68,0.8)";
              } : undefined}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Sign out</span>
            </button>
          </div>
        )}

        {/* Profile trigger */}
        <button
          onClick={() => setProfileOpen((p) => !p)}
          className={`flex w-full items-center py-3 transition-colors
            ${mini ? "justify-center px-3" : "gap-3 px-6"}
            ${dm ? "" : "hover:bg-accent"}`}
          onMouseEnter={dm ? (e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; } : undefined}
          onMouseLeave={dm ? (e) => { e.currentTarget.style.background = "transparent"; } : undefined}
          title={mini ? displayName : undefined}
        >
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${dm ? "" : "bg-primary/10"}`}
            style={dm ? { background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)" } : undefined}
          >
            <User
              className={`h-4 w-4 ${dm ? "" : "text-primary"}`}
              style={dm ? { color: "rgba(167,139,250,0.9)" } : undefined}
            />
          </div>
          {!mini && (
            <>
              <span
                className={`flex-1 text-left text-sm font-medium truncate ${dm ? "" : "text-foreground"}`}
                style={dm ? { color: "rgba(255,255,255,0.6)" } : undefined}
              >
                {displayName}
              </span>
              {profileOpen
                ? <ChevronDown className={`h-4 w-4 shrink-0 ${dm ? "" : "text-muted-foreground"}`} style={dm ? { color: "rgba(255,255,255,0.3)" } : undefined} />
                : <ChevronUp   className={`h-4 w-4 shrink-0 ${dm ? "" : "text-muted-foreground"}`} style={dm ? { color: "rgba(255,255,255,0.3)" } : undefined} />
              }
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// ── Sidebar link ────────────────────────────────────────────────────────────

interface SidebarLinkProps {
  href: string;
  icon: LucideIcon;
  label: string;
  dm: boolean;
  mini: boolean;
}

const SidebarLink = ({ href, icon: Icon, label, dm, mini }: SidebarLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Link href={href} className="group w-full">
      <div
        className={`relative flex cursor-pointer items-center text-sm font-medium transition-all duration-150
          ${mini ? "justify-center py-3 px-0" : "gap-3 px-6 py-2.5"}
          ${dm ? "" : (isActive
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground")}`}
        style={dm ? {
          background: isActive ? "rgba(139,92,246,0.1)" : "transparent",
          color: isActive ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.4)",
        } : undefined}
        onMouseEnter={dm ? (e) => {
          if (!isActive) {
            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
            e.currentTarget.style.color = "rgba(255,255,255,0.75)";
          }
        } : undefined}
        onMouseLeave={dm ? (e) => {
          if (!isActive) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "rgba(255,255,255,0.4)";
          }
        } : undefined}
      >
        {!mini && isActive && (
          <div className="absolute left-0 top-0 h-full w-0.5 rounded-r bg-primary" />
        )}
        <Icon className="h-4 w-4 shrink-0" />
        {!mini && <span>{label}</span>}
        {mini && (
          <span
            className={`pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md px-2.5 py-1.5
              text-xs font-medium opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-150 z-50
              ${dm ? "" : "bg-popover text-popover-foreground border border-border shadow-md"}`}
            style={dm ? {
              background: "#17161E",
              color: "rgba(255,255,255,0.85)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            } : undefined}
          >
            {label}
          </span>
        )}
      </div>
    </Link>
  );
};

// ── Team comps nav item (expandable in full mode, icon+tooltip in mini) ─────

const TeamCompsNavItem = ({ dm, mini }: { dm: boolean; mini: boolean }) => {
  const pathname = usePathname();
  const isActive = pathname === "/comps" || pathname.startsWith("/comps/");
  const [isExpanded, setIsExpanded] = useState(isActive);

  const { data: compsData } = useGetCompsQuery();
  const comps = compsData?.comps ?? [];

  useEffect(() => {
    if (isActive) setIsExpanded(true);
  }, [isActive]);

  if (mini) {
    return (
      <Link href="/comps" className="group w-full">
        <div
          className={`relative flex cursor-pointer items-center justify-center py-3 text-sm font-medium transition-all duration-150
            ${dm ? "" : (isActive
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground")}`}
          style={dm ? {
            background: isActive ? "rgba(139,92,246,0.1)" : "transparent",
            color: isActive ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.4)",
          } : undefined}
          onMouseEnter={dm ? (e) => {
            if (!isActive) {
              e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              e.currentTarget.style.color = "rgba(255,255,255,0.75)";
            }
          } : undefined}
          onMouseLeave={dm ? (e) => {
            if (!isActive) {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "rgba(255,255,255,0.4)";
            }
          } : undefined}
        >
          <BarChart3 className="h-4 w-4 shrink-0" />
          <span
            className={`pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md px-2.5 py-1.5
              text-xs font-medium opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-150 z-50
              ${dm ? "" : "bg-popover text-popover-foreground border border-border shadow-md"}`}
            style={dm ? {
              background: "#17161E",
              color: "rgba(255,255,255,0.85)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            } : undefined}
          >
            Team Comps
          </span>
        </div>
      </Link>
    );
  }

  return (
    <div>
      <div
        className={`relative flex items-center text-sm font-medium transition-all duration-150
          ${dm ? "" : (isActive
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground")}`}
        style={dm ? {
          background: isActive ? "rgba(139,92,246,0.1)" : "transparent",
          color: isActive ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.4)",
        } : undefined}
        onMouseEnter={dm ? (e) => {
          if (!isActive) {
            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
            e.currentTarget.style.color = "rgba(255,255,255,0.75)";
          }
        } : undefined}
        onMouseLeave={dm ? (e) => {
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
              className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${dm ? "" : "bg-primary/10 text-primary"}`}
              style={dm ? {
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
          className={`pr-5 py-2.5 pl-1 shrink-0 transition-colors ${dm ? "" : "text-muted-foreground"}`}
          style={dm ? { color: "rgba(255,255,255,0.3)" } : undefined}
          aria-label="Toggle saved comps"
        >
          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div
          className={`flex flex-col pb-1 ${dm ? "" : "bg-muted/30"}`}
          style={dm ? { background: "rgba(0,0,0,0.2)" } : undefined}
        >
          {comps.length === 0 ? (
            <p
              className={`py-1.5 pl-14 pr-6 text-xs ${dm ? "" : "text-muted-foreground/60"}`}
              style={dm ? { color: "rgba(255,255,255,0.2)" } : undefined}
            >
              No saved comps yet.
            </p>
          ) : (
            comps.map((comp) => {
              const compActive = pathname === `/comps/${comp.compId}`;
              return (
                <Link
                  key={comp.compId}
                  href={`/comps/${comp.compId}`}
                  className={`flex w-full items-center py-1.5 pl-14 pr-6 text-xs font-medium truncate transition-colors
                    ${dm ? "" : (compActive
                      ? "text-foreground bg-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent")}`}
                  style={dm ? { color: compActive ? "rgba(167,139,250,1)" : "rgba(139,92,246,0.6)" } : undefined}
                  onMouseEnter={dm ? (e) => { e.currentTarget.style.color = "rgba(167,139,250,1)"; } : undefined}
                  onMouseLeave={dm ? (e) => { e.currentTarget.style.color = compActive ? "rgba(167,139,250,1)" : "rgba(139,92,246,0.6)"; } : undefined}
                >
                  {comp.compName}
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
