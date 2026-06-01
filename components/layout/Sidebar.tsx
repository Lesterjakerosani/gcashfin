"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, DollarSign, BarChart3, PieChart, Shield,
  FileText, LogOut, ChevronLeft, ChevronRight, Moon, Sun,
  Menu, X,
} from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/salary", label: "Salary", icon: DollarSign },
  { href: "/notes", label: "Notes", icon: FileText },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/analytics", label: "Analytics", icon: PieChart },
  { href: "/settings", label: "Settings", icon: Shield },
];

type User = { name?: string | null; email?: string | null; role?: string };

export function Sidebar({ user }: { user: User }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("gcashfin-theme");
    if (saved === "dark") {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("gcashfin-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("gcashfin-theme", "light");
    }
  }

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={`flex flex-col h-full ${isMobile ? "" : ""}`}>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-[#3E4042]">
        {(!collapsed || isMobile) && (
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <img src="/favicon.ico" alt="GCashFin" className="w-8 h-8 rounded-xl object-contain flex-shrink-0" />
            <span className="font-bold text-gray-900 dark:text-[#E4E6EB] text-[15px] tracking-tight">GCashFin</span>
          </Link>
        )}
        {collapsed && !isMobile && (
          <img src="/favicon.ico" alt="GCashFin" className="w-8 h-8 rounded-xl object-contain mx-auto" />
        )}
        {isMobile ? (
          <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#3A3B3C] text-gray-400 transition-colors">
            <X size={16} />
          </button>
        ) : (
          <button onClick={() => setCollapsed(c => !c)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#3A3B3C] text-gray-400 dark:text-[#B0B3B8] transition-colors flex-shrink-0">
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href}
              title={collapsed && !isMobile ? label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
                ${active
                  ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm"
                  : "text-gray-600 dark:text-[#E4E6EB] hover:bg-gray-100 dark:hover:bg-[#3A3B3C] hover:text-gray-900 dark:hover:text-[#E4E6EB]"
                }
                ${collapsed && !isMobile ? "justify-center px-2" : ""}`}
            >
              <Icon size={16} className="flex-shrink-0" />
              {(!collapsed || isMobile) && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-3 border-t border-gray-100 dark:border-[#3E4042] space-y-0.5">
        <button onClick={toggleDark}
          title={collapsed && !isMobile ? (dark ? "Light Mode" : "Dark Mode") : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-[#E4E6EB] hover:bg-gray-100 dark:hover:bg-[#3A3B3C] hover:text-gray-900 dark:hover:text-[#E4E6EB] transition-colors ${collapsed && !isMobile ? "justify-center px-2" : ""}`}>
          {dark ? <Sun size={16} className="flex-shrink-0" /> : <Moon size={16} className="flex-shrink-0" />}
          {(!collapsed || isMobile) && <span>{dark ? "Light Mode" : "Dark Mode"}</span>}
        </button>

        {(!collapsed || isMobile) ? (
          <div className="px-3 py-2 mt-1">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-900 dark:text-[#E4E6EB] truncate">{user?.name || "User"}</div>
                <div className="text-[10px] text-gray-400 dark:text-[#B0B3B8] truncate">{user?.email}</div>
              </div>
            </div>
            <button onClick={() => signOut({ callbackUrl: "/auth/login" })}
              className="w-full flex items-center gap-2 text-xs text-gray-500 dark:text-[#B0B3B8] hover:text-red-500 dark:hover:text-red-400 transition-colors py-1">
              <LogOut size={12} /> Sign out
            </button>
          </div>
        ) : (
          <button onClick={() => signOut({ callbackUrl: "/auth/login" })}
            title="Sign out"
            className="w-full flex items-center justify-center px-2 py-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] transition-colors">
            <LogOut size={16} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-[#242526] border-b border-gray-200 dark:border-[#3E4042] px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <img src="/favicon.ico" alt="GCashFin" className="w-7 h-7 rounded-lg object-contain" />
          <span className="font-bold text-gray-900 dark:text-[#E4E6EB] text-sm">GCashFin</span>
        </Link>
        <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#3A3B3C] text-gray-600 dark:text-[#E4E6EB] transition-colors">
          <Menu size={18} />
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 bg-white dark:bg-[#242526] h-full shadow-xl animate-slide-in">
            <SidebarContent isMobile />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className={`hidden md:flex flex-col fixed left-0 top-0 h-screen bg-white dark:bg-[#242526] border-r border-gray-100 dark:border-[#3E4042] z-30 transition-all duration-300 ${collapsed ? "w-16" : "w-60"}`}>
        <SidebarContent />
      </aside>
    </>
  );
}
