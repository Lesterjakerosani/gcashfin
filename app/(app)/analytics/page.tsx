"use client";
import { useQuery } from "@tanstack/react-query";
import { fmt } from "@/lib/utils";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function StatCard({ label, value, sub, icon }: any) {
  return (
    <div className="bg-[rgba(15,15,15,0.92)] border border-white/[0.07] rounded-lg p-4 relative overflow-hidden group hover:border-red-800/40 transition-all">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#c0392b] opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="text-[10px] uppercase tracking-widest text-[#888] mb-2">{label}</div>
      <div className="font-display text-2xl tracking-wider text-white">{value}</div>
      {sub && <div className="text-[11px] text-[#555] mt-1">{sub}</div>}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-3xl opacity-[0.06]">{icon}</div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#111] border border-white/[0.07] rounded px-3 py-2 text-xs">
        <div className="text-[#888] mb-1">{label}</div>
        <div className="text-[#e74c3c] font-mono-num font-semibold">₱{fmt(payload[0].value)}</div>
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
    <div>
      <div className="font-display text-4xl tracking-[4px] text-white mb-1">ANALYTICS <span className="text-[#e74c3c]">CENTER</span></div>
      <p className="text-[#888] text-sm mb-6">Visual insights into your financial performance</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="All-time Profit" value={`₱${fmt(data?.allTime ?? 0)}`} icon="💰" />
        <StatCard label="Best Month" value={`₱${fmt(data?.bestMonthVal ?? 0)}`} sub={data?.bestMonthLabel} icon="🏆" />
        <StatCard label="Best Day" value={`₱${fmt(data?.bestDayVal ?? 0)}`} sub={data?.bestDayLabel} icon="☀️" />
        <StatCard label="Total Accounts" value={data?.totalAccounts ?? 0} icon="📱" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Trend Chart */}
        <div className="bg-[rgba(15,15,15,0.92)] border border-white/[0.07] rounded-lg p-5">
          <div className="font-display text-base tracking-[2px] text-white mb-1">PROFIT <span className="text-[#e74c3c]">TREND</span></div>
          <div className="text-[11px] text-[#888] mb-4">Last 30 days — daily profit</div>
          {!data?.trend?.some((d: any) => d.v > 0) ? (
            <div className="h-40 flex items-center justify-center text-[#555] text-xs">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={data.trend} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c0392b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#c0392b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="label" tick={{ fill: "#555", fontSize: 9 }} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={{ fill: "#555", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `₱${v >= 1000 ? (v/1000).toFixed(0)+"k" : v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="v" stroke="#c0392b" strokeWidth={2} fill="url(#profitGrad)" dot={false} activeDot={{ r: 4, fill: "#e74c3c" }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Monthly Bar Chart */}
        <div className="bg-[rgba(15,15,15,0.92)] border border-white/[0.07] rounded-lg p-5">
          <div className="font-display text-base tracking-[2px] text-white mb-1">MONTHLY <span className="text-[#e74c3c]">EARNINGS</span></div>
          <div className="text-[11px] text-[#888] mb-4">Last 6 months — total earnings</div>
          {!data?.monthly?.some((d: any) => d.v > 0) ? (
            <div className="h-40 flex items-center justify-center text-[#555] text-xs">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={data.monthly} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="label" tick={{ fill: "#555", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#555", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `₱${v >= 1000 ? (v/1000).toFixed(0)+"k" : v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="v" fill="#c0392b" fillOpacity={0.8} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Accounts */}
        <div className="bg-[rgba(15,15,15,0.92)] border border-white/[0.07] rounded-lg p-5">
          <div className="font-display text-base tracking-[2px] text-white mb-1">TOP <span className="text-[#e74c3c]">ACCOUNTS</span></div>
          <div className="text-[11px] text-[#888] mb-4">Ranked by balance usage</div>
          {!data?.topAccounts?.length ? (
            <div className="text-center py-8 text-[#555] text-xs">No accounts yet.</div>
          ) : data.topAccounts.map((a: any, i: number) => (
            <div key={a.id} className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
              <div className="font-display text-2xl text-[#333] w-7 flex-shrink-0">{i+1}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-sm text-white">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: a.color }} />
                  <span className="truncate">{a.model}</span>
                </div>
                <div className="text-[11px] text-[#888]">{a.phone} · {a.category}</div>
              </div>
              <div className="font-mono-num text-sm text-[#e74c3c] flex-shrink-0">₱{fmt(a.used)}</div>
            </div>
          ))}
        </div>

        {/* Account Usage Bar Chart */}
        <div className="bg-[rgba(15,15,15,0.92)] border border-white/[0.07] rounded-lg p-5">
          <div className="font-display text-base tracking-[2px] text-white mb-1">ACCOUNT <span className="text-[#e74c3c]">USAGE</span></div>
          <div className="text-[11px] text-[#888] mb-4">Balance utilization per account</div>
          {!data?.usageData?.length ? (
            <div className="h-40 flex items-center justify-center text-[#555] text-xs">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={data.usageData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="label" tick={{ fill: "#555", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#555", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `₱${v >= 1000 ? (v/1000).toFixed(0)+"k" : v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="v" fill="#c0392b" fillOpacity={0.75} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
