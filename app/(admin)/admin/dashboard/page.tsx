"use client";
import { useQuery } from "@tanstack/react-query";
import { Users, CreditCard, ArrowLeftRight, DollarSign, Activity, ShieldCheck, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

function StatCard({ label, value, icon: Icon, color, text, sub }: any) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-[#B0B3B8] uppercase tracking-wider">{label}</p>
          {sub && <p className="text-[10px] text-gray-400 dark:text-[#B0B3B8] mt-0.5">{sub}</p>}
        </div>
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
          <Icon size={18} className={text} />
        </div>
      </div>
      <p className={`text-3xl font-bold ${text}`}>{value?.toLocaleString() ?? 0}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => fetch("/api/admin/stats").then(r => r.json()),
    refetchInterval: 30000,
  });

  const { data: reportData } = useQuery({
    queryKey: ["admin-reports-chart"],
    queryFn: () => fetch("/api/admin/reports").then(r => r.json()),
  });

  const cards = [
    { label: "Total Users",        value: stats?.totalUsers,        sub: "Registered accounts",  icon: Users,          color: "bg-blue-100 dark:bg-blue-900/30",    text: "text-blue-600 dark:text-blue-400" },
    { label: "Total Accounts",     value: stats?.totalAccounts,     sub: "GCash accounts",       icon: CreditCard,     color: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400" },
    { label: "Total Transactions", value: stats?.totalTransactions, sub: "All time",             icon: ArrowLeftRight, color: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-600 dark:text-purple-400" },
    { label: "Salary Entries",     value: stats?.totalSalaryEntries,sub: "Income & expense logs",icon: DollarSign,     color: "bg-amber-100 dark:bg-amber-900/30",   text: "text-amber-600 dark:text-amber-400" },
    { label: "Activity Logs",      value: stats?.totalActivities,   sub: "System actions",       icon: Activity,       color: "bg-red-100 dark:bg-red-900/30",       text: "text-red-500 dark:text-red-400" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <ShieldCheck size={22} className="text-red-500" /> Admin Dashboard
          </h1>
          <p className="page-subtitle">System overview — manage users, records and monitor activity</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">System Online</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map(c => <StatCard key={c.label} {...c} />)}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Registrations Chart */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={15} className="text-blue-500" />
            <h2 className="section-title">User Registrations — Last 6 Months</h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={reportData?.usersByMonth || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="users" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Users" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Transactions Chart */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <ArrowLeftRight size={15} className="text-purple-500" />
            <h2 className="section-title">Transactions — Last 6 Months</h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={reportData?.txByMonth || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="add" fill="#10B981" radius={[4, 4, 0, 0]} name="Add" />
              <Bar dataKey="deduct" fill="#EF4444" radius={[4, 4, 0, 0]} name="Deduct" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="table-container">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-[#3E4042] flex items-center gap-2">
            <Users size={14} className="text-blue-500" />
            <h2 className="section-title">Recently Registered Users</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-[#3E4042]/50">
            {!stats?.recentUsers?.length ? (
              <p className="text-center py-8 text-sm text-gray-400 dark:text-[#B0B3B8]">No users yet.</p>
            ) : stats.recentUsers.map((u: any) => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-[#3A3B3C]/20 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {u.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-[#E4E6EB] truncate">{u.name}</p>
                  <p className="text-xs text-gray-400 dark:text-[#B0B3B8] truncate">{u.email}</p>
                </div>
                <span className="text-[10px] text-gray-400 dark:text-[#B0B3B8]">
                  {new Date(u.createdAt).toLocaleDateString("en-PH")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="table-container">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-[#3E4042] flex items-center gap-2">
            <Activity size={14} className="text-red-500" />
            <h2 className="section-title">Recent Activity</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-[#3E4042]/50">
            {!stats?.recentActivity?.length ? (
              <p className="text-center py-8 text-sm text-gray-400 dark:text-[#B0B3B8]">No activity yet.</p>
            ) : stats.recentActivity.map((a: any) => (
              <div key={a.id} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-[#3A3B3C]/20 transition-colors">
                <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 dark:text-[#E4E6EB]">{a.action}</p>
                  <p className="text-[10px] text-gray-400 dark:text-[#B0B3B8]">{a.userName} · {a.details}</p>
                </div>
                <span className="text-[10px] text-gray-400 dark:text-[#B0B3B8] flex-shrink-0">
                  {new Date(a.createdAt).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
