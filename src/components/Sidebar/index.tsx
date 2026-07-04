"use client";

import { useAppDispatch, useAppSelector } from "../../app/redux";
import { setIsSidebarCollapsed } from "../../state";
import { useGetAuthUserQuery } from "../../state/api";
import { loadComp, type SavedComp } from "../../state/teamSlice";
import { signOut } from "aws-amplify/auth";
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
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const Sidebar = () => {
  const dispatch = useAppDispatch();
  const isSidebarCollapsed = useAppSelector((state: any) => state.global?.isSidebarCollapsed ?? false);
  const savedComps = useAppSelector((state: any) => (state.team?.savedComps ?? []) as SavedComp[]);
  const { data: currentUser, isLoading } = useGetAuthUserQuery({});
  const currentUserDetails = currentUser?.userDetails;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const sidebarClassNames = `fixed flex flex-col h-full justify-between shadow-xl
    transition-all duration-300 z-40 overflow-y-auto
    bg-card border-r border-border
    ${isSidebarCollapsed ? "w-0 overflow-hidden" : "w-64"}
  `;

  return (
    <div className={sidebarClassNames}>
      <div className="flex h-full w-full flex-col justify-start">
        {/* Logo */}
        <div className="flex min-h-14 w-64 items-center justify-between px-6 pt-3 pb-2">
          <div className="text-lg font-bold text-foreground tracking-tight">
            Team Comp Diff
          </div>
          <button
            className="p-1 rounded hover:bg-accent"
            onClick={() => dispatch(setIsSidebarCollapsed(true))}
          >
            <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        {/* User section */}
        <div className="flex items-center gap-3 border-y border-border px-6 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </div>
          {isLoading ? (
            <div className="h-4 w-28 rounded bg-muted animate-pulse" />
          ) : (
            <span className="text-sm font-medium text-foreground truncate">
              {currentUserDetails?.username ?? currentUser?.user?.username ?? "—"}
            </span>
          )}
        </div>

        {/* Nav links */}
        <nav className="z-10 w-full mt-2">
          <SidebarLink icon={Home} label="Team Analysis" href="/" />
          <TeamCompsNavItem savedComps={savedComps} />
          <SidebarLink icon={Users} label="Draft" href="/draft" />
          <SidebarLink icon={Search} label="Opponent Scouting" href="/scouting" />
          <SidebarLink icon={User} label="Profile" href="/profile" />
        </nav>
      </div>

      {/* Bottom sign-out (mobile) */}
      <div className="flex w-full flex-col items-center gap-4 border-t border-border px-6 py-4 md:hidden">
        <div className="flex w-full items-center justify-between">
          <span className="text-sm text-foreground">{currentUserDetails?.username}</span>
          <button
            className="rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

interface SidebarLinkProps {
  href: string;
  icon: LucideIcon;
  label: string;
}

const SidebarLink = ({ href, icon: Icon, label }: SidebarLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Link href={href} className="w-full">
      <div
        className={`relative flex cursor-pointer items-center gap-3 px-6 py-2.5 text-sm transition-colors
          hover:bg-accent hover:text-accent-foreground
          ${isActive ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground"}`}
      >
        {isActive && <div className="absolute left-0 top-0 h-full w-0.5 bg-primary" />}
        <Icon className="h-4 w-4 shrink-0" />
        <span>{label}</span>
      </div>
    </Link>
  );
};

const TeamCompsNavItem = ({ savedComps }: { savedComps: SavedComp[] }) => {
  const pathname = usePathname();
  const dispatch  = useAppDispatch();
  const router    = useRouter();
  const isActive  = pathname === "/comps";
  const [isExpanded, setIsExpanded] = useState(isActive);

  // Auto-expand when the user navigates to /comps
  useEffect(() => {
    if (isActive) setIsExpanded(true);
  }, [isActive]);

  const handleLoadComp = (id: string) => {
    dispatch(loadComp(id));
    router.push("/");
  };

  return (
    <div>
      <div
        className={`relative flex items-center text-sm transition-colors
          hover:bg-accent hover:text-accent-foreground
          ${isActive ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground"}`}
      >
        {isActive && <div className="absolute left-0 top-0 h-full w-0.5 bg-primary" />}
        {/* Clicking the label+icon area navigates to /comps */}
        <Link href="/comps" className="flex flex-1 items-center gap-3 px-6 py-2.5 min-w-0">
          <BarChart3 className="h-4 w-4 shrink-0" />
          <span>Team Comps</span>
          {savedComps.length > 0 && (
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
              {savedComps.length}
            </span>
          )}
        </Link>
        {/* Chevron toggles the sub-list without navigating */}
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="pr-5 py-2.5 pl-1 shrink-0"
          aria-label="Toggle saved comps"
        >
          {isExpanded
            ? <ChevronUp className="h-3.5 w-3.5" />
            : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="flex flex-col pb-1">
          {savedComps.length === 0 ? (
            <p className="py-1.5 pl-13 pr-6 text-xs text-muted-foreground">
              No saved comps yet.
            </p>
          ) : (
            savedComps.map((comp) => (
              <button
                key={comp.id}
                onClick={() => handleLoadComp(comp.id)}
                title="Load into Team Analysis"
                className="flex w-full items-center py-1.5 pl-13 pr-6 text-left text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <span className="truncate">{comp.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
