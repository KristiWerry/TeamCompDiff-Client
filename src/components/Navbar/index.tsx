"use client";

import { Menu, Moon, Sun, User } from "lucide-react";
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
    <div
      className={`flex items-center justify-between px-4 py-2.5 sticky top-0 z-30
        ${isDarkMode ? "" : "bg-card border-b border-border"}`}
      style={isDarkMode ? { background: "#0d0d14", borderBottom: "1px solid rgba(255,255,255,0.07)" } : undefined}
    >
      {/* Left: menu toggle + brand when sidebar is collapsed */}
      <div className="flex items-center gap-3">
        {isSidebarCollapsed && (
          <button
            onClick={() => dispatch(setIsSidebarCollapsed(false))}
            className={`flex h-8 w-8 items-center justify-center rounded transition-all duration-150
              ${isDarkMode ? "" : "hover:bg-accent text-muted-foreground hover:text-foreground"}`}
            style={isDarkMode ? {
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              color: "rgba(255,255,255,0.5)",
            } : undefined}
            onMouseEnter={isDarkMode ? (e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              e.currentTarget.style.color = "rgba(255,255,255,0.8)";
            } : undefined}
            onMouseLeave={isDarkMode ? (e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              e.currentTarget.style.color = "rgba(255,255,255,0.5)";
            } : undefined}
          >
            <Menu className="h-4 w-4" />
          </button>
        )}

        {isSidebarCollapsed && (
          <div className={`${oxanium.className} text-sm font-black uppercase tracking-tight select-none hidden md:block`}>
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
        )}
      </div>

      {/* Right: dark mode toggle + user */}
      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        <button
          onClick={() => dispatch(setIsDarkMode(!isDarkMode))}
          className={`flex h-8 w-8 items-center justify-center rounded transition-all duration-150
            ${isDarkMode ? "" : "hover:bg-accent text-muted-foreground hover:text-foreground"}`}
          style={isDarkMode ? {
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            color: "rgba(255,255,255,0.4)",
          } : undefined}
          onMouseEnter={isDarkMode ? (e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.08)";
            e.currentTarget.style.color = "rgba(255,255,255,0.7)";
          } : undefined}
          onMouseLeave={isDarkMode ? (e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
            e.currentTarget.style.color = "rgba(255,255,255,0.4)";
          } : undefined}
          title="Toggle dark mode"
        >
          {isDarkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </button>

        {/* Divider */}
        <div
          className={`hidden h-5 w-px md:block ${isDarkMode ? "" : "bg-border"}`}
          style={isDarkMode ? { background: "rgba(255,255,255,0.08)" } : undefined}
        />

        {/* User info */}
        <div className="hidden items-center gap-2 md:flex">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full ${isDarkMode ? "" : "bg-primary/10"}`}
            style={isDarkMode ? { background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)" } : undefined}
          >
            <User
              className={`h-3.5 w-3.5 ${isDarkMode ? "" : "text-primary"}`}
              style={isDarkMode ? { color: "rgba(167,139,250,0.9)" } : undefined}
            />
          </div>

          {isLoading ? (
            <div
              className={`h-3 w-20 rounded animate-pulse ${isDarkMode ? "" : "bg-muted"}`}
              style={isDarkMode ? { background: "rgba(255,255,255,0.08)" } : undefined}
            />
          ) : (
            <span
              className={`text-xs font-medium ${isDarkMode ? "" : "text-foreground"}`}
              style={isDarkMode ? { color: "rgba(255,255,255,0.55)" } : undefined}
            >
              {displayName}
            </span>
          )}

          <button
            onClick={handleSignOut}
            className={`ml-1 rounded px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-opacity hover:opacity-90
              ${isDarkMode ? "text-white" : "bg-primary text-primary-foreground"}`}
            style={isDarkMode ? {
              background: "linear-gradient(135deg, rgba(139,92,246,1) 0%, rgba(99,60,220,1) 100%)",
              boxShadow: "0 0 12px rgba(139,92,246,0.25)",
            } : undefined}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
