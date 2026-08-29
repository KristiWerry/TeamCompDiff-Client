"use client";

import { Menu, Moon, Sun } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../app/redux";
import { setIsDarkMode, setIsSidebarCollapsed } from "../../state";
import { useGetAuthUserQuery } from "../../state/api";
import { signOut } from "aws-amplify/auth";
import { Oxanium } from "next/font/google";

const oxanium = Oxanium({ subsets: ["latin"], weight: ["700", "800"] });

const Navbar = () => {
  const dispatch           = useAppDispatch();
  const isSidebarCollapsed = useAppSelector((state: any) => state.global?.isSidebarCollapsed ?? false);
  const isDarkMode         = useAppSelector((state: any) => state.global?.isDarkMode ?? false);

  const { data: currentUser, isLoading } = useGetAuthUserQuery(undefined);
  const displayName = currentUser?.user?.username ?? "—";

  const handleSignOut = async () => {
    try { await signOut(); } catch (error) { console.error("Error signing out: ", error); }
  };

  return (
    <div className="flex items-center justify-between px-4 py-2.5 sticky top-0 z-30 bg-card border-b border-border dark:bg-[#0d0d14] dark:border-white/[0.07]">
      {/* Left: menu toggle + brand when sidebar is collapsed */}
      <div className="flex items-center gap-3">
        {isSidebarCollapsed && (
          <button
            onClick={() => dispatch(setIsSidebarCollapsed(false))}
            className="flex h-8 w-8 items-center justify-center rounded transition-all duration-150 hover:bg-accent text-muted-foreground hover:text-foreground dark:bg-white/4 dark:border dark:border-white/[0.07] dark:text-white/50 dark:hover:bg-white/8 dark:hover:text-white/80"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}

        {isSidebarCollapsed && (
          <div className={`${oxanium.className} text-sm font-black uppercase tracking-tight select-none hidden md:block`}>
            <span className="text-foreground dark:text-white/85">Team Comp </span>
            <span className="text-primary" style={{
              backgroundImage: "linear-gradient(90deg, rgba(139,92,246,1) 0%, rgba(167,139,250,1) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>Diff</span>
          </div>
        )}
      </div>

      {/* Right: dark mode toggle + user */}
      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        <button
          onClick={() => dispatch(setIsDarkMode(!isDarkMode))}
          className="flex h-8 w-8 items-center justify-center rounded transition-all duration-150 hover:bg-accent text-muted-foreground hover:text-foreground dark:bg-white/4 dark:border dark:border-white/[0.07] dark:text-white/40 dark:hover:bg-white/8 dark:hover:text-white/70"
          title="Toggle dark mode"
        >
          {isDarkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </button>

        {/* Divider */}
        <div className="hidden h-5 w-px md:block bg-border dark:bg-white/[0.08]" />

        {/* User info */}
        <div className="hidden items-center gap-2 md:flex">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 dark:bg-purple-500/15 dark:border dark:border-purple-500/30">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-primary dark:text-purple-300/90" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </div>

          {isLoading ? (
            <div className="h-3 w-20 rounded animate-pulse bg-muted dark:bg-white/[0.08]" />
          ) : (
            <span className="text-xs font-medium text-foreground dark:text-white/55">
              {displayName}
            </span>
          )}

          <button
            onClick={handleSignOut}
            className="ml-1 rounded px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-opacity hover:opacity-90 text-white bg-gradient-primary"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
