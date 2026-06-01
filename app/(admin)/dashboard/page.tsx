"use client";
import { useQuery } from "@tanstack/react-query";
import { Users, CreditCard, ArrowLeftRight, DollarSign, ShieldCheck } from "lucide-react";
import { fmt } from "@/lib/utils";

export default function AdminDashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => fetch("/api/admin/stats").then(r => r.json()),
  });

  const cards = [
    { label: "Total Users",        value: stats?.totalUsers        ?? 0, icon: Users,          color: "bg-blue-100 dark:bg-blue-900/30",    text: "text-blue-600 dark:text-blue-400" },
    { label: "Total Accounts",     value: stats?.totalAccounts     ?? 0, icon: CreditCard,      color: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400" },
    { label: "Total Transactions", value: stats?.totalTransactions ?? 0, icon: ArrowLeftRight,  color: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-600 dark:text-purple-400" },
    { label: "Salary Entries",     value: stats?.totalSalaryEntries ?? 0, icon: DollarSign,    color: "bg-amber-100 dark:bg-amber-900/30",   text: "text-amber-600 dark:text-amber-400" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">System overview — all users & activity</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color, text }) => (
          <div key={label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500 dark:text-[#B0B3B8] uppercase tracking-wider">{label}</span>
              <div className={`w-8 h-8 ${color} rounded-xl flex items-center justify-center`}>
                <Icon size={15} className={text} />
              </div>
            </div>
            <p className={`text-2xl font-semibold ${text}`}>{value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Recent Users */}
      <div className="table-container">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-[#3E4042] flex items-center gap-2">
          <ShieldCheck size={15} className="text-red-500" />
          <h2 className="section-title">Recently Registered Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["Name", "Email", "Role", "Joined"].map(h => (
                  <th key={h} className="th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!stats?.recentUsers?.length ? (
                <tr><td colSpan={4} className="text-center py-10 text-gray-400 dark:text-[#B0B3B8] text-sm">No users yet.</td></tr>
              ) : stats.recentUsers.map((u: any) => (
                <tr key={u.id} className="tr-hover">
                  <td className="td font-medium text-gray-900 dark:text-[#E4E6EB]">{u.name}</td>
                  <td className="td text-gray-500 dark:text-[#B0B3B8]">{u.email}</td>
                  <td className="td">
                    <span className={u.role === "admin" ? "badge-red" : "badge-green"}>{u.role}</span>
                  </td>
                  <td className="td text-xs text-gray-400 dark:text-[#B0B3B8]">
                    {new Date(u.createdAt).toLocaleDateString("en-PH")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
