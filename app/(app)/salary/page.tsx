"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Plus, Trash2, Download, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { fmt, MSHORT, MONTHS } from "@/lib/utils";

type Entry = { id: string; date: string; type: string; amount: number; category: string; notes?: string; createdAt: string; };

const PROFIT_CATS = ["Profit","Load","Send Money","Cash In","Cash Out","Other"];
const EXPENSE_CATS = ["Withdrawal","Load Cost","Fees","General","Other"];

function entryNet(e: Entry) { return e.type === "expense" ? -e.amount : e.amount; }

export default function SalaryPage() {
  const qc = useQueryClient();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0,10), type: "profit", amount: "", category: "Profit", notes: "" });
  const [editNotes, setEditNotes] = useState<Record<string, string>>({});

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

  const byDate: Record<string, Entry[]> = {};
  entries.forEach(e => { byDate[e.date] = [...(byDate[e.date] || []), e]; });
  const sortedDates = Object.keys(byDate).sort((a,b) => b.localeCompare(a));

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Salary Tracker</h1>
          <p className="page-subtitle">Track daily profits and expenses</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className="select-field w-auto">
            {MONTHS.map((m,i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="select-field w-auto">
            {years.map(y => <option key={y}>{y}</option>)}
          </select>
          <button onClick={exportCSV} className="btn-secondary gap-1.5">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Total Profit</span>
            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
              <TrendingUp size={15} className="text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">₱{fmt(totalProfit)}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Total Expense</span>
            <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
              <TrendingDown size={15} className="text-red-500 dark:text-red-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-red-500 dark:text-red-400">₱{fmt(totalExpense)}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Net Income</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${netIncome >= 0 ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
              <DollarSign size={15} className={netIncome >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"} />
            </div>
          </div>
          <div className={`text-2xl font-bold ${netIncome >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
            {netIncome >= 0 ? "+" : ""}₱{fmt(netIncome)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Entry Form */}
        <div className="card p-6">
          <h2 className="section-title mb-4">Add Entry</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="label">Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))} className="input-field" />
            </div>
            <div>
              <label className="label">Type</label>
              <div className="flex gap-2">
                {["profit","expense"].map(t => (
                  <button key={t} type="button" onClick={() => setForm(f => ({...f, type: t, category: t === "profit" ? "Profit" : "General"}))}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                      form.type === t
                        ? t === "profit"
                          ? "bg-emerald-500 text-white shadow-sm"
                          : "bg-red-500 text-white shadow-sm"
                        : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600"
                    }`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Amount (₱)</label>
              <input type="number" step="0.01" value={form.amount} onChange={e => setForm(f=>({...f,amount:e.target.value}))} placeholder="0.00" className="input-field font-mono" />
            </div>
            <div>
              <label className="label">Category</label>
              <select value={form.category} onChange={e => setForm(f=>({...f,category:e.target.value}))} className="select-field">
                {(form.type === "profit" ? PROFIT_CATS : EXPENSE_CATS).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Notes</label>
              <input value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} placeholder="Optional…" className="input-field" />
            </div>
            <button type="submit" disabled={addMut.isPending} className="btn-primary w-full">
              <Plus size={15} /> {addMut.isPending ? "Adding…" : "Add Entry"}
            </button>
          </form>
        </div>

        {/* Transaction History */}
        <div className="lg:col-span-2 table-container flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700">
            <h2 className="section-title">Transaction History</h2>
          </div>
          <div className="overflow-y-auto max-h-[480px] flex-1">
            {sortedDates.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-gray-400 dark:text-slate-500 text-sm">
                No entries for {MONTHS[month]} {year}
              </div>
            ) : sortedDates.map(date => (
              <div key={date}>
                <div className="px-5 py-2 bg-gray-50 dark:bg-slate-900/30 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider border-b border-gray-100 dark:border-slate-700/50">
                  {date}
                </div>
                {byDate[date].map(e => (
                  <div key={e.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/30 border-b border-gray-100 dark:border-slate-700/30 transition-colors">
                    <div className={`w-1 h-8 rounded-full flex-shrink-0 ${e.type === "profit" ? "bg-emerald-500" : "bg-red-500"}`} />
                    <div className="flex-1 min-w-0">
                      <span className={`text-xs font-medium ${e.type === "profit" ? "badge-green" : "badge-red"}`}>{e.category}</span>
                      <div className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 truncate">{e.notes || "No notes"}</div>
                    </div>
                    <div className={`font-mono text-sm font-semibold flex-shrink-0 ${e.type === "profit" ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                      {e.type === "profit" ? "+" : "-"}₱{fmt(e.amount)}
                    </div>
                    <button onClick={() => { if(confirm("Delete this entry?")) delMut.mutate(e.id); }} className="text-gray-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors flex-shrink-0 ml-1">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Spreadsheet */}
      <div className="table-container">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
          <h2 className="section-title">Monthly Spreadsheet — {MONTHS[month]} {year}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Day","Date","Profit","Expense","Net","Notes"].map(h => (
                  <th key={h} className="th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allDays.map(({ day, ds, entries: dayEntries }) => {
                const profit = dayEntries.filter(e=>e.type==="profit").reduce((s,e)=>s+e.amount,0);
                const expense = dayEntries.filter(e=>e.type==="expense").reduce((s,e)=>s+e.amount,0);
                const net = profit - expense;
                const isToday = ds === new Date().toISOString().slice(0,10);
                return (
                  <tr key={ds} className={`tr-hover ${isToday ? "bg-emerald-50/50 dark:bg-emerald-900/10" : ""}`}>
                    <td className="td font-bold text-gray-400 dark:text-slate-500 w-12">{String(day).padStart(2,"0")}</td>
                    <td className="td text-gray-500 dark:text-slate-400">
                      {new Date(ds+"T00:00:00").toLocaleDateString("en-PH",{weekday:"short",month:"short",day:"numeric"})}
                      {isToday && <span className="ml-2 badge-green text-[10px]">Today</span>}
                    </td>
                    <td className="td font-mono font-semibold text-emerald-600 dark:text-emerald-400">{profit > 0 ? `+₱${fmt(profit)}` : "—"}</td>
                    <td className="td font-mono font-semibold text-red-500 dark:text-red-400">{expense > 0 ? `-₱${fmt(expense)}` : "—"}</td>
                    <td className={`td font-mono font-semibold ${net > 0 ? "text-emerald-600 dark:text-emerald-400" : net < 0 ? "text-red-500 dark:text-red-400" : "text-gray-400 dark:text-slate-500"}`}>
                      {net !== 0 ? `${net>0?"+":""}₱${fmt(net)}` : "—"}
                    </td>
                    <td className="td text-gray-400 dark:text-slate-500 max-w-[160px] truncate">{dayEntries.map(e=>e.notes).filter(Boolean).join(", ") || "—"}</td>
                  </tr>
                );
              })}
              <tr className="bg-gray-50 dark:bg-slate-900/50 border-t-2 border-gray-200 dark:border-slate-600">
                <td colSpan={2} className="px-4 py-3 text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">Total</td>
                <td className="px-4 py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">+₱{fmt(totalProfit)}</td>
                <td className="px-4 py-3 font-mono font-bold text-red-500 dark:text-red-400">-₱{fmt(totalExpense)}</td>
                <td className={`px-4 py-3 font-mono font-bold ${netIncome >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                  {netIncome >= 0 ? "+" : ""}₱{fmt(netIncome)}
                </td>
                <td className="px-4 py-3" />
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
