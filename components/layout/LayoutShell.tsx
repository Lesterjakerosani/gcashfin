"use client";
import { useState } from "react";
import { Sidebar } from "./Sidebar";

type User = { name?: string | null; email?: string | null; role?: string };

export function LayoutShell({ children, user }: { children: React.ReactNode; user: User }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-200 dark:bg-slate-900">
      <Sidebar user={user} />
      <main className={`transition-all duration-300 min-h-screen
        md:${collapsed ? "ml-16" : "ml-60"}
        pt-14 md:pt-0
        md:ml-60
      `}>
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
