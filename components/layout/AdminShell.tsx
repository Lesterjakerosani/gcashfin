"use client";
import { AdminSidebar } from "./AdminSidebar";

type User = { name?: string | null; email?: string | null; role?: string };

export function AdminShell({ children, user }: { children: React.ReactNode; user: User }) {
  return (
    <div className="min-h-screen bg-slate-200 dark:bg-[#18191A]">
      <AdminSidebar user={user} />
      <main className="transition-all duration-300 min-h-screen pt-14 md:pt-0 md:ml-60">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
