"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Plus, Trash2, Download } from "lucide-react";
import { fmt, MSHORT, MONTHS } from "@/lib/utils";

type Entry = { id: string; date: string; type: string; amount: number; category: string; notes?: string; createdAt: string; };

const PROFIT_CATS = ["Profit","Load","Send Money","Cash In","Cash Out","Other"];
const EXPENSE_CATS = ["Withdrawal","Load Cost","Fees","General","Other"];

function entryNet(e: Entry) { return e.type === "expense" ? -e.amount : e.amount; }

function getPHDate() {
  return new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()).split('/').reverse().join('-');
}

export default function SalaryPage() {
  const qc = useQueryClient();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [currentPHDate, setCurrentPHDate] = useState(getPHDate());
  const [form, setForm] = useState({ date: currentPHDate, type: "profit", amount: "", category: "Profit", notes: "" });
  const [editNotes, setEditNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    const interval = setInterval(() => {
      const newDate = getPHDate();
      if (newDate !== currentPHDate) {
        setCurrentPHDate(newDate);
        setForm(f => ({...f, date: newDate}));
      }
    }, 60000); // check every minute
    return () => clearInterval(interval);
  }, [currentPHDate]);

  const { data: entries = [] } = useQuery<Entry[]>({
    queryKey: ["salary", month, year],
    queryFn: () => fetch(`/api/salary?month=${month}&year=${year}`).then(r => r.json()),
  });

  const addMut = useMutation({
    mutationFn: (data: any) => fetch("/api/salary", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["salary"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); toast.success("Entry added!"); setForm(f => ({...f, amount: "", notes: ""})); },
    onError: () => toast.error("Failed to add entry."),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => fetch(`/api/salary/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["salary"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); toast.success("Entry deleted."); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) => fetch(`/api/salary/${id}`, { method: "PUT", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ notes }) }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["salary"] }); toast.success("Notes updated."); },
  });

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) { toast.error("Enter a valid amount."); return; }
    addMut.mutate({ date: form.date, type: form.type, amount: parseFloat(form.amount), category: form.category, notes: form.notes });
  }

  const totalProfit = entries.filter(e => e.type === "profit").reduce((s, e) => s + e.amount, 0);
  const totalExpense = entries.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0);
  const netIncome = totalProfit - totalExpense;

  // Group by date
  const byDate: Record<string, Entry[]> = {};
  entries.forEach(e => { byDate[e.date] = [...(byDate[e.date] || []), e]; });
  const sortedDates = Object.keys(byDate).sort((a,b) => b.localeCompare(a));

  // Spreadsheet: days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const allDays = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    const ds = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    return { day: d, ds, entries: byDate[ds] || [] };
  });

  function exportCSV() {
    const rows = [["Date","Type","Amount","Category","Notes"]];
    entries.forEach(e => rows.push([e.date, e.type, String(e.amount), e.category, e.notes || ""]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv); a.download = `salary_${MONTHS[month]}_${year}.csv`; a.click();
    toast.success("CSV exported.");
  }

  const years = [now.getFullYear()-1, now.getFullYear(), now.getFullYear()+1];

  return (
    <div>
      <div className="font-display text-4xl tracking-[4px] text-white mb-1">SALARY <span className="text-[#e74c3c]">TRACKER</span></div>
      <p className="text-[#888] text-sm mb-6">Track daily profits and expenses</p>

      {/* Month selector */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className="bg-white/[0.04] border border-white/[0.07] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-red-700">
          {MONTHS.map((m,i) => <option key={m} value={i}>{m}</option>)}
        </select>
        <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="bg-white/[0.04] border border-white/[0.07] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-red-700">
          {years.map(y => <option key={y}>{y}</option>)}
        </select>
        <button onClick={exportCSV} className="flex items-center gap-1.5 border border-white/[0.07] text-[#888] hover:text-white px-3 py-2 rounded text-xs transition-colors ml-auto">
          <Download size={12} /> Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-[rgba(15,15,15,0.92)] border border-white/[0.07] rounded-lg p-4">
          <div className="text-[10px] uppercase tracking-widest text-[#888] mb-2">Total Profit</div>
          <div className="font-display text-3xl tracking-wider text-[#27ae60]">₱{fmt(totalProfit)}</div>
        </div>
        <div className="bg-[rgba(15,15,15,0.92)] border border-white/[0.07] rounded-lg p-4">
          <div className="text-[10px] uppercase tracking-widest text-[#888] mb-2">Total Expense</div>
          <div className="font-display text-3xl tracking-wider text-[#e74c3c]">₱{fmt(totalExpense)}</div>
        </div>
        <div className="bg-[rgba(15,15,15,0.92)] border border-white/[0.07] rounded-lg p-4">
          <div className="text-[10px] uppercase tracking-widest text-[#888] mb-2">Net Income</div>
          <div className={`font-display text-3xl tracking-wider ${netIncome >= 0 ? "text-[#27ae60]" : "text-[#e74c3c]"}`}>₱{fmt(netIncome)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Add Entry Form */}
        <div className="bg-[rgba(15,15,15,0.92)] border border-white/[0.07] rounded-lg p-5">
          <div className="font-display text-lg tracking-[2px] text-white mb-4">ADD <span className="text-[#e74c3c]">ENTRY</span></div>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#888] mb-1">Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))} className="w-full bg-white/[0.04] border border-white/[0.07] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-red-700" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#888] mb-1">Type</label>
              <div className="flex gap-2">
                {["profit","expense"].map(t => (
                  <button key={t} type="button" onClick={() => setForm(f => ({...f, type: t, category: t === "profit" ? "Profit" : "General"}))}
                    className={`flex-1 py-2 rounded text-xs font-semibold uppercase tracking-wide transition-all ${form.type === t ? (t === "profit" ? "bg-[#27ae60] text-white" : "bg-[#e74c3c] text-white") : "bg-white/[0.04] text-[#888] hover:text-white"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#888] mb-1">Amount (₱)</label>
              <input type="number" step="0.01" value={form.amount} onChange={e => setForm(f=>({...f,amount:e.target.value}))} placeholder="0.00" className="w-full bg-white/[0.04] border border-white/[0.07] rounded px-3 py-2 text-sm text-white font-mono-num focus:outline-none focus:border-red-700" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#888] mb-1">Category</label>
              <select value={form.category} onChange={e => setForm(f=>({...f,category:e.target.value}))} className="w-full bg-[#111] border border-white/[0.07] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-red-700">
                {(form.type === "profit" ? PROFIT_CATS : EXPENSE_CATS).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#888] mb-1">Notes</label>
              <input value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} placeholder="Optional…" className="w-full bg-white/[0.04] border border-white/[0.07] rounded px-3 py-2 text-sm text-white placeholder-[#555] focus:outline-none focus:border-red-700" />
            </div>
            <button type="submit" disabled={addMut.isPending} className="w-full flex items-center justify-center gap-2 bg-[#c0392b] hover:bg-[#e74c3c] text-white py-2.5 rounded text-sm font-semibold tracking-wide transition-all disabled:opacity-50">
              <Plus size={14} /> {addMut.isPending ? "Adding…" : "Add Entry"}
            </button>
          </form>
        </div>

        {/* Transaction History */}
        <div className="lg:col-span-2 bg-[rgba(15,15,15,0.92)] border border-white/[0.07] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-white/[0.07]">
            <div className="font-display text-lg tracking-[2px] text-white">TRANSACTION <span className="text-[#e74c3c]">HISTORY</span></div>
          </div>
          <div className="overflow-y-auto max-h-[400px]">
            {sortedDates.length === 0 ? (
              <div className="text-center py-12 text-[#555] text-xs">No entries for {MONTHS[month]} {year}</div>
            ) : sortedDates.map(date => (
              <div key={date} className="border-b border-white/[0.03]">
                <div className="px-4 py-2 bg-white/[0.02] text-[10px] text-[#555] uppercase tracking-widest font-semibold">{date}</div>
                {byDate[date].map(e => (
                  <div key={e.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] transition-colors">
                    <div className={`w-1.5 h-8 rounded-full flex-shrink-0 ${e.type === "profit" ? "bg-[#27ae60]" : "bg-[#e74c3c]"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-widest text-[#888]">{e.category}</span>
                      </div>
                      <div className="text-[11px] text-[#555] truncate">{e.notes || "No notes"}</div>
                    </div>
                    <div className={`font-mono-num text-sm font-semibold ${e.type === "profit" ? "text-[#27ae60]" : "text-[#e74c3c]"}`}>
                      {e.type === "profit" ? "+" : "-"}₱{fmt(e.amount)}
                    </div>
                    <button onClick={() => { if(confirm("Delete this entry?")) delMut.mutate(e.id); }} className="text-[#555] hover:text-[#e74c3c] transition-colors flex-shrink-0">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Spreadsheet */}
      <div className="bg-[rgba(15,15,15,0.92)] border border-white/[0.07] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-white/[0.07] flex items-center justify-between">
          <div className="font-display text-lg tracking-[2px] text-white">MONTHLY <span className="text-[#e74c3c]">SPREADSHEET</span> — {MONTHS[month].toUpperCase()} {year}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                {["Day","Date","Profit","Expense","Net","Notes"].map(h => (
                  <th key={h} className="bg-[rgba(10,10,10,0.9)] text-[#888] text-[10px] font-semibold uppercase tracking-[1.2px] px-4 py-2.5 border-b border-white/[0.07] text-left sticky top-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allDays.map(({ day, ds, entries: dayEntries }) => {
                const profit = dayEntries.filter(e=>e.type==="profit").reduce((s,e)=>s+e.amount,0);
                const expense = dayEntries.filter(e=>e.type==="expense").reduce((s,e)=>s+e.amount,0);
                const net = profit - expense;
                const isToday = ds === currentPHDate;
                return (
                  <tr key={ds} className={`border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors ${isToday ? "bg-white/[0.03]" : ""}`}>
                    <td className="px-4 py-2 font-display text-lg text-[#555]">{String(day).padStart(2,"0")}</td>
                    <td className="px-4 py-2 text-[#888] text-[11px]">{new Date(ds+"T00:00:00").toLocaleDateString("en-PH",{weekday:"short",month:"short",day:"numeric"})}</td>
                    <td className="px-4 py-2 font-mono-num font-semibold text-[#27ae60]">{profit > 0 ? `+₱${fmt(profit)}` : "—"}</td>
                    <td className="px-4 py-2 font-mono-num font-semibold text-[#e74c3c]">{expense > 0 ? `-₱${fmt(expense)}` : "—"}</td>
                    <td className={`px-4 py-2 font-mono-num font-semibold ${net > 0 ? "text-[#27ae60]" : net < 0 ? "text-[#e74c3c]" : "text-[#555]"}`}>{net !== 0 ? `${net>0?"+":""}₱${fmt(net)}` : "—"}</td>
                    <td className="px-4 py-2 text-[#555] text-[11px] max-w-[160px] truncate">{dayEntries.map(e=>e.notes).filter(Boolean).join(", ") || "—"}</td>
                  </tr>
                );
              })}
              <tr className="border-t-2 border-white/[0.1] bg-white/[0.03]">
                <td colSpan={2} className="px-4 py-3 font-semibold text-white text-xs uppercase tracking-widest">TOTAL</td>
                <td className="px-4 py-3 font-mono-num font-bold text-[#27ae60]">+₱{fmt(totalProfit)}</td>
                <td className="px-4 py-3 font-mono-num font-bold text-[#e74c3c]">-₱{fmt(totalExpense)}</td>
                <td className={`px-4 py-3 font-mono-num font-bold ${netIncome >= 0 ? "text-[#27ae60]" : "text-[#e74c3c]"}`}>{netIncome >= 0 ? "+" : ""}₱{fmt(netIncome)}</td>
                <td className="px-4 py-3" />
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
