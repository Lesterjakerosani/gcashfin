"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Printer } from "lucide-react";
import { fmt } from "@/lib/utils";
import toast from "react-hot-toast";

type TabType = "daily" | "monthly" | "accounts" | "transactions";

function BarChart({ data }: { data: { label: string; v: number }[] }) {
  const max = Math.max(...data.map(d => d.v), 1);
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-20 text-[11px] text-[#888] text-right flex-shrink-0">{d.label}</div>
          <div className="flex-1 h-6 bg-white/[0.05] rounded overflow-hidden">
            <div className="h-full bg-[#c0392b] rounded transition-all duration-700 flex items-center justify-end pr-2" style={{ width: `${((d.v / max) * 100).toFixed(1)}%` }}>
              {d.v > 0 && <span className="text-[10px] text-white/80 font-mono-num whitespace-nowrap">₱{fmt(d.v)}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  const [tab, setTab] = useState<TabType>("daily");

  const { data } = useQuery({
    queryKey: ["reports", tab],
    queryFn: () => fetch(`/api/reports?type=${tab}`).then(r => r.json()),
  });

  const TABS: { key: TabType; label: string }[] = [
    { key: "daily", label: "Daily" },
    { key: "monthly", label: "Monthly" },
    { key: "accounts", label: "Accounts" },
    { key: "transactions", label: "Transactions" },
  ];

  async function exportCSV() {
    const res = await fetch("/api/reports?type=transactions");
    const d = await res.json();
    const rows = [["TX ID","Date","Type","Account","Amount","Status"]];
    d.transactions?.forEach((t: any) => rows.push([t.id, new Date(t.createdAt).toLocaleDateString("en-PH"), t.type, t.account, String(t.amount), t.status]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv); a.download = "gcashfin_report.csv"; a.click();
    toast.success("Exported.");
  }

  return (
    <div>
      <div className="font-display text-4xl tracking-[4px] text-white mb-1">FINANCIAL <span className="text-[#e74c3c]">REPORTS</span></div>
      <p className="text-[#888] text-sm mb-4">Summaries, breakdowns, and exportable financial reports</p>

      <div className="flex gap-2 mb-5">
        <button onClick={exportCSV} className="flex items-center gap-1.5 border border-white/[0.07] text-[#888] hover:text-white px-3 py-1.5 rounded text-xs transition-colors">
          <Download size={12} /> Export CSV
        </button>
        <button onClick={() => window.print()} className="flex items-center gap-1.5 border border-white/[0.07] text-[#888] hover:text-white px-3 py-1.5 rounded text-xs transition-colors">
          <Printer size={12} /> Print
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/[0.07] mb-6">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 text-xs font-semibold uppercase tracking-widest transition-all border-b-2 -mb-px ${tab === t.key ? "text-[#e74c3c] border-[#e74c3c]" : "text-[#888] border-transparent hover:text-white"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Daily */}
      {tab === "daily" && data && (
        <div>
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: "Today's Profit", value: `₱${fmt(data.todayProfit ?? 0)}` },
              { label: "Today's Transactions", value: data.todayTx ?? 0 },
              { label: "Active Accounts", value: data.activeAccounts ?? 0 },
            ].map(s => (
              <div key={s.label} className="bg-[rgba(15,15,15,0.92)] border border-white/[0.07] rounded-lg p-4">
                <div className="text-[10px] uppercase tracking-widest text-[#888] mb-2">{s.label}</div>
                <div className="font-display text-3xl tracking-wider text-white">{s.value}</div>
              </div>
            ))}
          </div>
          <div className="bg-[rgba(15,15,15,0.92)] border border-white/[0.07] rounded-lg p-5">
            <div className="text-[11px] uppercase tracking-widest text-[#888] mb-4">Last 30 Days — Profit</div>
            <BarChart data={data.last7 || []} />
          </div>
        </div>
      )}

      {/* Monthly */}
      {tab === "monthly" && data && (
        <div>
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: "This Month", value: `₱${fmt(data.thisMonth ?? 0)}` },
              { label: "Last Month", value: `₱${fmt(data.lastMonth ?? 0)}` },
              { label: "Growth", value: data.growth ?? "—" },
            ].map(s => (
              <div key={s.label} className="bg-[rgba(15,15,15,0.92)] border border-white/[0.07] rounded-lg p-4">
                <div className="text-[10px] uppercase tracking-widest text-[#888] mb-2">{s.label}</div>
                <div className="font-display text-3xl tracking-wider text-white">{s.value}</div>
              </div>
            ))}
          </div>
          <div className="bg-[rgba(15,15,15,0.92)] border border-white/[0.07] rounded-lg p-5">
            <div className="text-[11px] uppercase tracking-widest text-[#888] mb-4">Monthly Breakdown — Last 6 Months</div>
            <BarChart data={data.months || []} />
          </div>
        </div>
      )}

      {/* Accounts */}
      {tab === "accounts" && data && (
        <div className="bg-[rgba(15,15,15,0.92)] border border-white/[0.07] rounded-lg p-5">
          <div className="text-[11px] uppercase tracking-widest text-[#888] mb-4">Account Summary</div>
          {!data.length ? (
            <div className="text-center py-10 text-[#555] text-xs">No accounts found.</div>
          ) : data.map((a: any) => (
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-4 py-3 border-b border-white/[0.04] last:border-0">
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: a.color }} />
                <span className="text-white">{a.model}</span>
                <span className="font-mono-num text-[11px] text-[#888]">{a.phone}</span>
                <span className="bg-white/[0.05] border border-white/[0.07] text-[#888] text-[10px] px-2 py-0.5 rounded-full">{a.category}</span>
              </div>
              <div className="flex gap-5 font-mono-num text-[12px]">
                <span className="text-[#888]">Used: <span className="text-[#e74c3c]">₱{fmt(a.used)}</span></span>
                <span className="text-[#888]">Limit: <span className="text-white">₱{fmt(a.limit)}</span></span>
                <span className="text-[#888]">Avail: <span className="text-[#27ae60]">₱{fmt(a.available)}</span></span>
                <span className="text-[#555]">{a.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transactions */}
      {tab === "transactions" && data && (
        <div>
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: "Total Transactions", value: data.total ?? 0 },
              { label: "Total Added", value: `₱${fmt(data.totalAdded ?? 0)}` },
              { label: "Total Deducted", value: `₱${fmt(data.totalDeducted ?? 0)}` },
            ].map(s => (
              <div key={s.label} className="bg-[rgba(15,15,15,0.92)] border border-white/[0.07] rounded-lg p-4">
                <div className="text-[10px] uppercase tracking-widest text-[#888] mb-2">{s.label}</div>
                <div className="font-display text-3xl tracking-wider text-white">{s.value}</div>
              </div>
            ))}
          </div>
          <div className="bg-[rgba(15,15,15,0.92)] border border-white/[0.07] rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>{["TX ID","Date","Type","Account","Amount","Status"].map(h => (
                    <th key={h} className="bg-[rgba(10,10,10,0.9)] text-[#888] text-[10px] font-semibold uppercase tracking-widest px-4 py-2.5 border-b border-white/[0.07] text-left sticky top-0">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {!data.transactions?.length ? (
                    <tr><td colSpan={6} className="text-center py-10 text-[#555] text-xs">No transactions.</td></tr>
                  ) : data.transactions.map((t: any) => (
                    <tr key={t.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                      <td className="px-4 py-2 font-mono-num text-[#555] text-[10px]">{t.id.slice(-8)}</td>
                      <td className="px-4 py-2 text-[#888]">{new Date(t.createdAt).toLocaleDateString("en-PH")}</td>
                      <td className="px-4 py-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${t.type==="Add"?"bg-red-900/20 text-[#e74c3c] border-red-700/30":t.type==="Deduct"?"bg-green-900/20 text-[#27ae60] border-green-700/30":"bg-white/[0.05] text-[#888] border-white/[0.07]"}`}>{t.type}</span>
                      </td>
                      <td className="px-4 py-2 text-white">{t.account}</td>
                      <td className={`px-4 py-2 font-mono-num font-semibold ${t.type==="Add"?"text-[#27ae60]":"text-[#e74c3c]"}`}>₱{fmt(t.amount)}</td>
                      <td className="px-4 py-2"><span className="bg-green-900/20 text-[#27ae60] border border-green-700/30 text-[10px] px-2 py-0.5 rounded-full">Completed</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
