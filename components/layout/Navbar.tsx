"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, DollarSign, BarChart3, PieChart, Settings, LogOut, Menu, X } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/salary", label: "Salary", icon: DollarSign },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/analytics", label: "Analytics", icon: PieChart },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Navbar({ user }: { user: { name?: string; email?: string; role?: string } }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-[rgba(8,8,8,0.96)] border-b border-white/[0.07] backdrop-blur-xl h-14 flex items-center px-7">
      <Link href="/dashboard" className="font-display text-[22px] tracking-[3px] text-[#e74c3c] mr-8 whitespace-nowrap flex-shrink-0">
        GCASH<span className="text-[#f0f0f0]">FIN</span>
      </Link>
      {/* Desktop links */}
      <ul className="hidden md:flex gap-0.5 flex-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href}>
              <Link href={href} className={`flex items-center gap-1.5 px-3 py-2 rounded text-[11px] font-medium tracking-wide uppercase transition-all ${active ? "text-[#e74c3c] bg-[rgba(192,57,43,0.15)]" : "text-[#888] hover:text-[#f0f0f0] hover:bg-white/[0.05]"}`}>
                <Icon size={13} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="hidden md:flex items-center gap-3 ml-auto">
        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] rounded-full py-1 pl-1.5 pr-3">
          <div className="w-6 h-6 rounded-full bg-[#c0392b] flex items-center justify-center text-[10px] font-bold text-white">
            {user?.name?.[0]?.toUpperCase() || "A"}
          </div>
          <span className="text-[#888] text-xs">{user?.name || "Admin"}</span>
        </div>
        <button onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="flex items-center gap-1.5 text-[#555] hover:text-[#e74c3c] text-xs transition-colors">
          <LogOut size={13} /> Sign out
        </button>
      </div>
      {/* Mobile */}
      <button className="md:hidden ml-auto text-[#888]" onClick={() => setMobileOpen(!mobileOpen)}>
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      {mobileOpen && (
        <div className="md:hidden absolute top-14 left-0 right-0 bg-[rgba(8,8,8,0.98)] border-b border-white/[0.07] p-4 z-50">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded text-sm mb-1 ${pathname === href ? "text-[#e74c3c] bg-[rgba(192,57,43,0.15)]" : "text-[#888] hover:text-white"}`}>
              <Icon size={15} />{label}
            </Link>
          ))}
          <button onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="flex items-center gap-2 px-3 py-2.5 text-[#e74c3c] text-sm w-full mt-2">
            <LogOut size={15} /> Sign out
          </button>
        </div>
      )}
    </nav>
  );
}
