"use client";

import React, { useEffect } from "react";
import AuthProvider from "./authProvider";
import Sidebar from "../components/Sidebar";
import ReduxProvider, { useAppSelector } from "./redux";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const isSidebarCollapsed = useAppSelector((state) => state.global?.isSidebarCollapsed ?? false);
  const isDarkMode = useAppSelector((state) => state.global?.isDarkMode ?? false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <Sidebar />
      <main
        className={`flex w-full flex-col bg-background transition-all duration-300 ${
          isSidebarCollapsed ? "ml-14" : "ml-64"
        }`}
      >
        <div className="flex-1 p-6">{children}</div>
      </main>
    </div>
  );
};

const DashboardWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <ReduxProvider>
      <AuthProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </AuthProvider>
    </ReduxProvider>
  );
};

export default DashboardWrapper;
