"use client";
import { useQuery } from "@tanstack/react-query";
import { fmt } from "@/lib/utils";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Trophy, Sun, Smartphone } from "lucide-react";

function StatCard({ label, value, sub, icon: Icon, iconColor }: { label: string; value: string | number; sub?: string; icon: any; iconColor: string }) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconColor}`}>
          <Icon size={15} />
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
      {sub && <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-card-hover px-3 py-2 text-xs">
        <div className="text-gray-500 dark:text-slate-400 mb-1">{label}</div>
        <div className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">₱{fmt(payload[0].value)}</div>
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const { data } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => fetch("/api/analytics").then(r => r.json()),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Visual insights into your financial performance</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="All-time Profit" value={`₱${fmt(data?.allTime ?? 0)}`} icon={TrendingUp} iconColor="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" />
        <StatCard label="Best Month" value={`₱${fmt(data?.bestMonthVal ?? 0)}`} sub={data?.bestMonthLabel} icon={Trophy} iconColor="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" />
        <StatCard label="Best Day" value={`₱${fmt(data?.bestDayVal ?? 0)}`} sub={data?.bestDayLabel} icon={Sun} iconColor="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" />
        <StatCard label="Total Accounts" value={data?.totalAccounts ?? 0} icon={Smartphone} iconColor="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Trend Chart */}
        <div className="card p-5">
          <h2 className="section-title mb-0.5">Profit Trend</h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">Last 30 days — daily profit</p>
          {!data?.trend?.some((d: any) => d.v > 0) ? (
            <div className="h-40 flex items-center justify-center text-gray-400 dark:text-slate-500 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={data.trend} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" className="dark:[stroke:rgba(255,255,255,0.05)]" />
                <XAxis dataKey="label" tick={{ fill: "#9CA3AF", fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={{ fill: "#9CA3AF", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₱${v >= 1000 ? (v/1000).toFixed(0)+"k" : v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="v" stroke="#10B981" strokeWidth={2} fill="url(#profitGrad)" dot={false} activeDot={{ r: 4, fill: "#10B981", stroke: "#fff", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Monthly Bar Chart */}
        <div className="card p-5">
          <h2 className="section-title mb-0.5">Monthly Earnings</h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">Last 6 months — total earnings</p>
          {!data?.monthly?.some((d: any) => d.v > 0) ? (
            <div className="h-40 flex items-center justify-center text-gray-400 dark:text-slate-500 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.monthly} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" className="dark:[stroke:rgba(255,255,255,0.05)]" />
                <XAxis dataKey="label" tick={{ fill: "#9CA3AF", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9CA3AF", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₱${v >= 1000 ? (v/1000).toFixed(0)+"k" : v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="v" fill="#10B981" fillOpacity={0.85} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Accounts */}
        <div className="card p-5">
          <h2 className="section-title mb-0.5">Top Accounts</h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">Ranked by balance usage</p>
          {!data?.topAccounts?.length ? (
            <div className="text-center py-8 text-gray-400 dark:text-slate-500 text-sm">No accounts yet.</div>
          ) : data.topAccounts.map((a: any, i: number) => (
            <div key={a.id} className="flex items-center gap-3 py-3 border-b border-gray-100 dark:border-slate-700/50 last:border-0">
              <div className="text-2xl font-bold text-gray-200 dark:text-slate-700 w-7 flex-shrink-0 text-center">{i+1}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-sm font-medium text-gray-800 dark:text-slate-200">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: a.color }} />
                  <span className="truncate">{a.model}</span>
                </div>
                <div className="text-xs text-gray-400 dark:text-slate-500">{a.phone} · {a.category}</div>
              </div>
              <div className="font-mono text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex-shrink-0">₱{fmt(a.used)}</div>
            </div>
          ))}
        </div>

        {/* Account Usage Bar Chart */}
        <div className="card p-5">
          <h2 className="section-title mb-0.5">Account Usage</h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">Balance utilization per account</p>
          {!data?.usageData?.length ? (
            <div className="h-40 flex items-center justify-center text-gray-400 dark:text-slate-500 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.usageData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" className="dark:[stroke:rgba(255,255,255,0.05)]" />
                <XAxis dataKey="label" tick={{ fill: "#9CA3AF", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9CA3AF", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₱${v >= 1000 ? (v/1000).toFixed(0)+"k" : v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="v" fill="#3B82F6" fillOpacity={0.8} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
