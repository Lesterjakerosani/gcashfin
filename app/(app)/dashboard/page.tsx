"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Plus, Minus, RefreshCw, Edit2, Trash2, Archive, Copy, ChevronLeft, ChevronRight, X, Download } from "lucide-react";
import { fmt, ACCOUNT_COLORS, MONTHS } from "@/lib/utils";

type Account = {
  id: string; model: string; phone: string; balance: number; used: number;
  limit: number; category: string; color: string; notes?: string; archived: boolean;
  available?: number; usagePct?: number;
};
type Tx = { id: string; type: string; amount: number; balAfter: number; phone: string; account: string; category: string; notes?: string; status: string; createdAt: string; };

const CATS = ["Personal", "Business", "Savings", "Shared"];

function StatCard({ label, value, sub, color = "gray" }: { label: string; value: string | number; sub?: string; color?: string }) {
  const colors: Record<string, string> = {
    gray: "text-gray-900 dark:text-[#E4E6EB]",
    green: "text-emerald-600 dark:text-emerald-400",
    blue: "text-blue-600 dark:text-blue-400",
    red: "text-red-500 dark:text-red-400",
    purple: "text-purple-600 dark:text-purple-400",
  };
  return (
    <div className="stat-card">
      <p className="text-xs font-medium text-gray-500 dark:text-[#B0B3B8] uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-2xl font-medium ${colors[color]} leading-none`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-[#B0B3B8] mt-1.5">{sub}</p>}
    </div>
  );
}

function UsageBar({ pct }: { pct: number }) {
  const color = pct >= 100 ? "bg-red-500" : pct >= 75 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="space-y-1">
      <div className="w-20 h-1.5 bg-gray-100 dark:bg-[#3A3B3C] rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <span className="text-[11px] text-gray-400 dark:text-[#B0B3B8]">{pct.toFixed(1)}%</span>
    </div>
  );
}

export default function DashboardPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState(""); const [catFilter, setCatFilter] = useState(""); const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const [txSearch, setTxSearch] = useState(""); const [txType, setTxType] = useState(""); const [txDate, setTxDate] = useState(""); const [txPage, setTxPage] = useState(1);
  const [amtInputs, setAmtInputs] = useState<Record<string, string>>({});
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ model: "", phone: "", balance: "", limit: "100000", category: "Personal", color: "#10B981", notes: "" });
  const [selectedColor, setSelectedColor] = useState("#10B981");

  const { data: stats } = useQuery({ queryKey: ["dashboard"], queryFn: () => fetch("/api/dashboard").then(r => r.json()) });
  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["accounts", search, catFilter, statusFilter],
    queryFn: () => fetch(`/api/accounts?search=${search}&category=${catFilter}&status=${statusFilter}`).then(r => r.json()),
  });
  const { data: txData } = useQuery({
    queryKey: ["transactions", txSearch, txType, txDate, txPage],
    queryFn: () => fetch(`/api/transactions?search=${txSearch}&type=${txType}&date=${txDate}&page=${txPage}`).then(r => r.json()),
  });

  const saveMut = useMutation({
    mutationFn: async (data: any) => {
      const url = editId ? `/api/accounts/${editId}` : "/api/accounts";
      const res = await fetch(url, { method: editId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to save account.");
      return body;
    },
    onSuccess: () => { qc.invalidateQueries(); setShowModal(false); toast.success(editId ? "Account updated!" : "Account added!"); },
    onError: (e: any) => toast.error(e?.message || "Failed to save account."),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to delete account.");
      return body;
    },
    onSuccess: () => { qc.invalidateQueries(); toast.success("Account deleted."); },
    onError: (error: any) => toast.error(error?.message || "Failed to delete account."),
  });

  const archMut = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const res = await fetch(`/api/accounts/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ archived }) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to update account.");
      return body;
    },
    onSuccess: () => { qc.invalidateQueries(); toast.success("Updated."); },
    onError: (error: any) => toast.error(error?.message || "Failed to update account."),
  });

  const txMut = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Transaction failed.");
      return body;
    },
    onSuccess: () => { qc.invalidateQueries(); toast.success("Transaction completed!"); },
    onError: (error: any) => toast.error(error?.message || "Transaction failed."),
  });

  function openAdd() { setEditId(null); setForm({ model: "", phone: "", balance: "", limit: "100000", category: "Personal", color: "#10B981", notes: "" }); setSelectedColor("#10B981"); setShowModal(true); }
  function openEdit(a: Account) { setEditId(a.id); setForm({ model: a.model, phone: a.phone, balance: String(a.balance), limit: String(a.limit), category: a.category, color: a.color, notes: a.notes || "" }); setSelectedColor(a.color); setShowModal(true); }
  function handleSave(e: React.FormEvent) { e.preventDefault(); saveMut.mutate({ model: form.model, phone: form.phone, balance: parseFloat(form.balance) || 0, limit: parseFloat(form.limit) || 100000, category: form.category, color: selectedColor, notes: form.notes, archived: false }); }

  function handleTx(accountId: string, type: string) {
    const amt = parseFloat(amtInputs[accountId] || "0");
    if (type !== "Reset" && (!amt || amt <= 0)) { toast.error("Enter a valid amount."); return; }
    txMut.mutate({ accountId, type, amount: amt, notes: noteInputs[accountId] || "" });
    setAmtInputs(prev => ({ ...prev, [accountId]: "" }));
    setNoteInputs(prev => ({ ...prev, [accountId]: "" }));
  }

  function copyPhone(phone: string) {
    navigator.clipboard.writeText(phone).then(() => toast.success("Phone number copied!"));
  }

  async function exportTxCSV() {
    const res = await fetch(`/api/transactions?search=${txSearch}&type=${txType}&date=${txDate}&page=1&perPage=10000`);
    const data = await res.json();
    const rows = [["TX ID", "Date", "Time", "Type", "Phone", "Account", "Category", "Amount", "Bal After", "Notes", "Status"]];
    (data.transactions || []).forEach((t: Tx) => {
      const d = new Date(t.createdAt);
      rows.push([
        t.id.slice(-8),
        d.toLocaleDateString("en-PH"),
        d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }),
        t.type, t.phone, t.account, t.category,
        String(t.amount), String(t.balAfter),
        t.notes || "", t.status,
      ]);
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv); a.download = "transactions.csv"; a.click();
    toast.success("CSV exported.");
  }

  const getStatus = (a: Account) => {
    if (a.archived) return { label: "Archived", cls: "badge-gray" };
    const pct = a.limit ? (a.used / a.limit) * 100 : 0;
    if (pct >= 100) return { label: "Full", cls: "badge-red" };
    if (pct >= 75) return { label: "High", cls: "badge-yellow" };
    return { label: "Active", cls: "badge-green" };
  };

  const hasFilters = !!(txSearch || txType || txDate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">Account Overview</h1>
        <p className="page-subtitle">Real-time GCash account monitoring & transaction management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Accounts" value={stats?.totalAccounts ?? 0} sub="Active accounts" />
        <StatCard label="Total Balance" value={`₱${fmt(stats?.totalBalance ?? 0)}`} sub="Combined balance" color="blue" />
        <StatCard label="Total Used" value={`₱${fmt(stats?.totalUsed ?? 0)}`} sub="Amount deployed" color="purple" />
        <StatCard label="Total Available" value={`₱${fmt(stats?.totalAvailable ?? 0)}`} sub="Remaining capacity" color="green" />
        <StatCard label="Monthly Profit" value={`₱${fmt(stats?.monthlyProfit ?? 0)}`} sub={stats?.monthLabel} color="green" />
        <StatCard label="Daily Profit" value={`₱${fmt(stats?.dailyProfit ?? 0)}`} sub="Today's earnings" color="green" />
        <StatCard label="Highest Day" value={`₱${fmt(stats?.highestDay ?? 0)}`} sub={stats?.highestDate || "—"} color="blue" />
        <StatCard label="Transactions" value={stats?.totalTransactions ?? 0} sub="All time" />
      </div>

      {/* Account Management */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="section-title">Account Management</h2>
            <p className="text-xs text-gray-400 dark:text-[#B0B3B8] mt-0.5">Manage and monitor your GCash accounts</p>
          </div>
          <button onClick={openAdd} className="btn-primary">
            <Plus size={14} /> Add Account
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search accounts…" className="input-field !w-44 !py-2" />
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="select-field !w-auto !py-2">
            <option value="">All Categories</option>{CATS.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="select-field !w-auto !py-2">
            <option value="">All Status</option>{["Active", "Full", "Archived"].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* Accounts Table */}
        <div className="table-container">
          <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10">
                <tr>
                  {["#", "Model", "Phone", "Category", "Used", "Limit", "Available", "Usage", "Status", "Amount", "Tx Notes", "Acc Notes", "Actions"].map(h => (
                    <th key={h} className="th whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {accounts.length === 0 ? (
                  <tr><td colSpan={13} className="text-center py-14 text-gray-400 dark:text-[#B0B3B8]">
                    <div className="text-3xl mb-2">📱</div>
                    <div className="text-sm">No accounts yet. Add your first GCash account.</div>
                  </td></tr>
                ) : accounts.map((a, i) => {
                  const avail = a.available ?? Math.max(0, a.limit - a.used);
                  const pct = a.usagePct ?? (a.limit ? (a.used / a.limit) * 100 : 0);
                  const st = getStatus(a);
                  return (
                    <tr key={a.id} className="tr-hover">
                      <td className="td text-gray-400 dark:text-[#B0B3B8] text-xs">{i + 1}</td>
                      <td className="td">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: a.color }} />
                          <span className="font-medium text-gray-900 dark:text-[#E4E6EB]">{a.model}</span>
                        </div>
                      </td>
                      <td className="td font-mono text-xs text-gray-500 dark:text-[#B0B3B8]">
                        <div className="flex items-center gap-1">
                          {a.phone}
                          <button onClick={() => copyPhone(a.phone)} title="Copy phone" className="text-gray-300 dark:text-slate-600 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                            <Copy size={11} />
                          </button>
                        </div>
                      </td>
                      <td className="td"><span className="badge-gray">{a.category}</span></td>
                      <td className="td font-mono text-emerald-600 dark:text-emerald-400">₱{fmt(a.used)}</td>
                      <td className="td font-mono text-gray-500 dark:text-[#B0B3B8]">₱{fmt(a.limit)}</td>
                      <td className="td font-mono text-gray-900 dark:text-[#E4E6EB]">₱{fmt(avail)}</td>
                      <td className="td"><UsageBar pct={pct} /></td>
                      <td className="td"><span className={st.cls}>{st.label}</span></td>
                      <td className="td">
                        <input type="number" placeholder="0.00" value={amtInputs[a.id] || ""}
                          onChange={e => setAmtInputs(p => ({ ...p, [a.id]: e.target.value }))}
                          className="w-24 bg-gray-50 dark:bg-[#3A3B3C] border border-gray-200 dark:border-[#3E4042] rounded-lg px-2 py-1.5 text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono" />
                      </td>
                      <td className="td">
                        <input type="text" placeholder="Note…" value={noteInputs[a.id] || ""}
                          onChange={e => setNoteInputs(p => ({ ...p, [a.id]: e.target.value }))}
                          className="w-28 bg-gray-50 dark:bg-[#3A3B3C] border border-gray-200 dark:border-[#3E4042] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </td>
                      <td className="td text-xs text-gray-400 dark:text-[#B0B3B8] max-w-[90px] truncate">{a.notes || "—"}</td>
                      <td className="td">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleTx(a.id, "Add")} title="Add" className="w-7 h-7 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition-colors"><Plus size={11} /></button>
                          <button onClick={() => handleTx(a.id, "Deduct")} title="Deduct" className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-[#3A3B3C] hover:bg-gray-200 dark:hover:bg-[#3A3B3C] text-gray-600 dark:text-[#E4E6EB] flex items-center justify-center transition-colors"><Minus size={11} /></button>
                          <button onClick={() => handleTx(a.id, "Reset")} title="Reset" className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-[#3A3B3C] hover:bg-gray-200 dark:hover:bg-[#3A3B3C] text-gray-500 dark:text-[#B0B3B8] flex items-center justify-center transition-colors"><RefreshCw size={11} /></button>
                          <button onClick={() => openEdit(a)} title="Edit" className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-colors"><Edit2 size={11} /></button>
                          <button onClick={() => archMut.mutate({ id: a.id, archived: !a.archived })} title={a.archived ? "Unarchive" : "Archive"} className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-[#3A3B3C] hover:bg-gray-200 dark:hover:bg-[#3A3B3C] text-gray-500 flex items-center justify-center transition-colors"><Archive size={11} /></button>
                          <button onClick={() => { if (confirm("Delete this account?")) delMut.mutate(a.id); }} title="Delete" className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-500 flex items-center justify-center transition-colors"><Trash2 size={11} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="section-title">Transaction History</h2>
            <p className="text-xs text-gray-400 dark:text-[#B0B3B8] mt-0.5">
              {hasFilters && txData?.total != null
                ? `${txData.total} result${txData.total !== 1 ? "s" : ""} found`
                : "All account activity"}
            </p>
          </div>
          <button onClick={exportTxCSV} className="btn-secondary gap-1.5 text-xs">
            <Download size={13} /> Export CSV
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          <input value={txSearch} onChange={e => { setTxSearch(e.target.value); setTxPage(1); }} placeholder="Search transactions…" className="input-field !w-44 !py-2" />
          <select value={txType} onChange={e => { setTxType(e.target.value); setTxPage(1); }} className="select-field !w-auto !py-2">
            <option value="">All Types</option>{["Add", "Deduct", "Reset"].map(t => <option key={t}>{t}</option>)}
          </select>
          <input type="date" value={txDate} onChange={e => { setTxDate(e.target.value); setTxPage(1); }} className="input-field !w-auto !py-2" />
          <button onClick={() => { setTxSearch(""); setTxType(""); setTxDate(""); setTxPage(1); }} className="btn-ghost text-xs py-2">Clear</button>
        </div>

        <div className="table-container">
          <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10">
                <tr>
                  {["TX ID", "Date", "Time", "Type", "Phone", "Account", "Category", "Amount", "Bal After", "Notes", "Status"].map(h => (
                    <th key={h} className="th whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!txData?.transactions?.length ? (
                  <tr><td colSpan={11} className="text-center py-10 text-gray-400 dark:text-[#B0B3B8] text-sm">No transactions found.</td></tr>
                ) : txData.transactions.map((t: Tx) => {
                  const d = new Date(t.createdAt);
                  const typeCls = t.type === "Add" ? "badge-green" : t.type === "Deduct" ? "badge-red" : "badge-gray";
                  return (
                    <tr key={t.id} className="tr-hover">
                      <td className="td font-mono text-xs text-gray-400 dark:text-[#B0B3B8]">{t.id.slice(-8)}</td>
                      <td className="td text-xs">{d.toLocaleDateString("en-PH")}</td>
                      <td className="td text-xs">{d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}</td>
                      <td className="td"><span className={typeCls}>{t.type}</span></td>
                      <td className="td font-mono text-xs">{t.phone}</td>
                      <td className="td font-medium text-gray-900 dark:text-[#E4E6EB]">{t.account}</td>
                      <td className="td text-gray-500 dark:text-[#B0B3B8]">{t.category}</td>
                      <td className={`td font-mono ${t.type === "Add" ? "text-emerald-600 dark:text-emerald-400" : t.type === "Deduct" ? "text-red-500 dark:text-red-400" : "text-gray-500"}`}>
                        {t.type === "Add" ? "+" : t.type === "Deduct" ? "-" : ""}₱{fmt(t.amount)}
                      </td>
                      <td className="td font-mono text-gray-900 dark:text-[#E4E6EB]">₱{fmt(t.balAfter)}</td>
                      <td className="td text-xs text-gray-400 dark:text-[#B0B3B8]">{t.notes || "—"}</td>
                      <td className="td"><span className="badge-green">Completed</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {txData?.pages > 1 && (
          <div className="flex justify-end gap-1 mt-3">
            <button disabled={txPage <= 1} onClick={() => setTxPage(p => p - 1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-[#3E4042] text-gray-500 disabled:opacity-30 hover:border-gray-300 dark:hover:border-slate-600 transition-colors">
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: txData.pages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setTxPage(p)} className={`w-8 h-8 flex items-center justify-center rounded-lg border text-xs font-medium transition-colors ${p === txPage ? "bg-gray-900 dark:bg-white border-gray-900 dark:border-white text-white dark:text-gray-900" : "border-gray-200 dark:border-[#3E4042] text-gray-500 hover:border-gray-300 dark:hover:border-slate-600"}`}>{p}</button>
            ))}
            <button disabled={txPage >= txData.pages} onClick={() => setTxPage(p => p + 1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-[#3E4042] text-gray-500 disabled:opacity-30 hover:border-gray-300 dark:hover:border-slate-600 transition-colors">
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#242526] border border-gray-200 dark:border-[#3E4042] rounded-2xl shadow-modal w-full max-w-[480px] animate-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-[#3E4042]">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-[#E4E6EB]">{editId ? "Edit" : "Add"} Account</h2>
                <p className="text-xs text-gray-400 dark:text-[#B0B3B8] mt-0.5">GCash account details</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#3A3B3C] text-gray-400 transition-colors"><X size={16} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Phone Model</label>
                  <input value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} required placeholder="e.g. Samsung A34" className="input-field" />
                </div>
                <div>
                  <label className="label">Phone Number</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required placeholder="09XXXXXXXXX" className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Starting Balance (₱)</label>
                  <input type="number" value={form.balance} onChange={e => setForm(f => ({ ...f, balance: e.target.value }))} placeholder="0" className="input-field" />
                </div>
                <div>
                  <label className="label">GCash Limit (₱)</label>
                  <input type="number" value={form.limit} onChange={e => setForm(f => ({ ...f, limit: e.target.value }))} placeholder="100000" className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="select-field">
                    {CATS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Color</label>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {ACCOUNT_COLORS.map(c => (
                      <button key={c} type="button" onClick={() => setSelectedColor(c)}
                        className="w-6 h-6 rounded-full transition-all flex-shrink-0"
                        style={{ background: c, outline: selectedColor === c ? `2px solid ${c}` : "2px solid transparent", outlineOffset: "2px" }} />
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="label">Notes</label>
                <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes…" className="input-field" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saveMut.isPending} className="btn-primary">
                  {saveMut.isPending ? "Saving…" : "Save Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
