"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { BarChart3, Download, TrendingUp, Users, ArrowLeftRight, DollarSign } from "lucide-react";
import { fmt } from "@/lib/utils";

const COLORS = ["#10B981", "#EF4444", "#3B82F6", "#F59E0B", "#8B5CF6"];

export default function AdminReportsPage() {
  const now = new Date();
  const [from, setFrom] = useState(`${now.getFullYear()}-01-01`);
  const [to, setTo] = useState(`${now.getFullYear()}-12-31`);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-reports", from, to],
    queryFn: () => fetch(`/api/admin/reports?from=${from}&to=${to}`).then(r => r.json()),
  });

  const pieData = data ? [
    { name: "Profit", value: Math.round(data.totals?.profit || 0) },
    { name: "Expense", value: Math.round(data.totals?.expense || 0) },
  ] : [];

  function exportCSV() {
    if (!data) return;
    const rows = [["Metric", "Value"],
      ["Total Users", data.totals?.users],
      ["Total Accounts", data.totals?.accounts],
      ["Total Transactions", data.totals?.transactions],
      ["Total Salary Entries", data.totals?.salary],
      ["Total Profit", data.totals?.profit],
      ["Total Expense", data.totals?.expense],
      ["Net Income", data.totals?.profit - data.totals?.expense],
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv); a.download = `report_${from}_${to}.csv`; a.click();
  }

  function exportExcel() {
    exportCSV(); // CSV opens in Excel
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2"><BarChart3 size={20} className="text-red-500" />Reports Dashboard</h1>
          <p className="page-subtitle">System-wide statistics and analytics</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input-field !w-auto !py-2" />
          <span className="text-gray-400 text-sm">to</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="input-field !w-auto !py-2" />
          <button onClick={exportCSV} className="btn-secondary gap-1.5 text-xs"><Download size={13} />CSV</button>
          <button onClick={exportExcel} className="btn-secondary gap-1.5 text-xs"><Download size={13} />Excel</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Users",        value: data?.totals?.users,        icon: Users,          color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-100 dark:bg-blue-900/30" },
          { label: "Transactions", value: data?.totals?.transactions,  icon: ArrowLeftRight, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-900/30" },
          { label: "Total Profit", value: data?.totals?.profit != null ? `₱${fmt(data.totals.profit)}` : "—", icon: TrendingUp, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
          { label: "Net Income",   value: data?.totals ? `₱${fmt(data.totals.profit - data.totals.expense)}` : "—", icon: DollarSign, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500 dark:text-[#B0B3B8] uppercase tracking-wider">{label}</span>
              <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center`}><Icon size={15} className={color} /></div>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{isLoading ? "…" : (value ?? 0).toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="section-title mb-4">User Registrations by Month</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.usersByMonth || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="users" fill="#3B82F6" radius={[4, 4, 0, 0]} name="New Users" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="section-title mb-4">Transactions by Month</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data?.txByMonth || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="add" stroke="#10B981" strokeWidth={2} dot={false} name="Add" />
              <Line type="monotone" dataKey="deduct" stroke="#EF4444" strokeWidth={2} dot={false} name="Deduct" />
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="section-title mb-4">Profit vs Expense</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: any) => `₱${fmt(v)}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="section-title mb-4">Summary Table</h2>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100 dark:divide-[#3E4042]">
              {[
                ["Total Users", data?.totals?.users ?? 0],
                ["Total Accounts", data?.totals?.accounts ?? 0],
                ["Total Transactions", data?.totals?.transactions ?? 0],
                ["Total Salary Entries", data?.totals?.salary ?? 0],
                ["Total Profit", `₱${fmt(data?.totals?.profit ?? 0)}`],
                ["Total Expense", `₱${fmt(data?.totals?.expense ?? 0)}`],
                ["Net Income", `₱${fmt((data?.totals?.profit ?? 0) - (data?.totals?.expense ?? 0))}`],
              ].map(([label, value]) => (
                <tr key={label as string}>
                  <td className="py-2.5 text-gray-500 dark:text-[#B0B3B8]">{label}</td>
                  <td className="py-2.5 text-right font-semibold text-gray-900 dark:text-[#E4E6EB]">{isLoading ? "…" : value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
