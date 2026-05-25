"use client";

import React from "react";
import { Menu, Moon, Sun, User } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../app/redux";
import { setIsDarkMode, setIsSidebarCollapsed } from "../../state";
import { useGetAuthUserQuery } from "../../state/api";
import { signOut } from "aws-amplify/auth";

const Navbar = () => {
  const dispatch = useAppDispatch();
  const isSidebarCollapsed = useAppSelector((state) => state.global?.isSidebarCollapsed ?? false);
  const isDarkMode = useAppSelector((state) => state.global?.isDarkMode ?? false);

  const { data: currentUser, isLoading } = useGetAuthUserQuery({});
  const currentUserDetails = currentUser?.userDetails;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2.5 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {isSidebarCollapsed && (
          <button
            onClick={() => dispatch(setIsSidebarCollapsed(false))}
            className="rounded p-1.5 hover:bg-accent"
          >
            <Menu className="h-5 w-5 text-muted-foreground" />
          </button>
        )}
        <span className="text-sm font-semibold text-foreground hidden md:block">Team Comp Diff</span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => dispatch(setIsDarkMode(!isDarkMode))}
          className="rounded p-2 hover:bg-accent"
          title="Toggle dark mode"
        >
          {isDarkMode ? (
            <Sun className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Moon className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        <div className="mx-2 hidden h-5 w-px bg-border md:block" />

        <div className="hidden items-center gap-2 md:flex">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
            <User className="h-3.5 w-3.5 text-primary" />
          </div>
          {isLoading ? (
            <div className="h-3.5 w-20 rounded bg-muted animate-pulse" />
          ) : (
            <span className="text-sm text-foreground">
              {currentUserDetails?.username ?? currentUser?.user?.username ?? "—"}
            </span>
          )}
          <button
            className="ml-1 rounded bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:opacity-90"
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
