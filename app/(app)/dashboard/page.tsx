"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Plus, Minus, RefreshCw, Edit2, Trash2, Archive, Copy, ChevronLeft, ChevronRight } from "lucide-react";
import { fmt, ACCOUNT_COLORS, MONTHS } from "@/lib/utils";

type Account = {
  id: string; model: string; phone: string; balance: number; used: number;
  limit: number; category: string; color: string; notes?: string; archived: boolean;
};
type Tx = { id: string; type: string; amount: number; balAfter: number; phone: string; account: string; category: string; notes?: string; status: string; createdAt: string; };

const CATS = ["Personal","Business","Savings","Shared"];

function StatCard({ label, value, sub, icon }: any) {
  return (
    <div className="bg-[rgba(15,15,15,0.92)] border border-white/[0.07] rounded-lg p-4 relative overflow-hidden group hover:border-red-800/40 hover:translate-y-[-1px] transition-all">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#c0392b] opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="text-[10px] uppercase tracking-[1.5px] text-[#888] font-semibold mb-2">{label}</div>
      <div className="font-display text-3xl tracking-wider text-white leading-none">{value}</div>
      {sub && <div className="text-[11px] text-[#555] mt-1.5">{sub}</div>}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-3xl opacity-[0.06]">{icon}</div>
    </div>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  const cls = pct >= 100 ? "bg-[#e74c3c]" : pct >= 75 ? "bg-[#f39c12]" : "bg-[#27ae60]";
  return (
    <div>
      <div className="w-20 h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
        <div className={`h-full ${cls} rounded-full transition-all`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <div className="text-[10px] text-[#888] mt-0.5">{pct.toFixed(1)}%</div>
    </div>
  );
}

export default function DashboardPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState(""); const [catFilter, setCatFilter] = useState(""); const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false); const [editId, setEditId] = useState<string|null>(null);
  const [txSearch, setTxSearch] = useState(""); const [txType, setTxType] = useState(""); const [txDate, setTxDate] = useState(""); const [txPage, setTxPage] = useState(1);
  const [amtInputs, setAmtInputs] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ model:"", phone:"", balance:"", limit:"100000", category:"Personal", color:"#c0392b", notes:"" });
  const [selectedColor, setSelectedColor] = useState("#c0392b");

  const { data: stats } = useQuery({ queryKey: ["dashboard"], queryFn: () => fetch("/api/dashboard").then(r=>r.json()) });
  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["accounts", search, catFilter, statusFilter],
    queryFn: () => fetch(`/api/accounts?search=${search}&category=${catFilter}&status=${statusFilter}`).then(r=>r.json()),
  });
  const { data: txData } = useQuery({
    queryKey: ["transactions", txSearch, txType, txDate, txPage],
    queryFn: () => fetch(`/api/transactions?search=${txSearch}&type=${txType}&date=${txDate}&page=${txPage}`).then(r=>r.json()),
  });

  const saveMut = useMutation({
    mutationFn: async (data: any) => {
      const url = editId ? `/api/accounts/${editId}` : "/api/accounts";
      const res = await fetch(url, { method: editId ? "PUT" : "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries(); setShowModal(false); toast.success(editId ? "Account updated!" : "Account added!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => fetch(`/api/accounts/${id}`, { method: "DELETE" }).then(r=>r.json()),
    onSuccess: () => { qc.invalidateQueries(); toast.success("Account deleted."); },
  });

  const archMut = useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      fetch(`/api/accounts/${id}`, { method: "PUT", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ archived }) }).then(r=>r.json()),
    onSuccess: () => { qc.invalidateQueries(); toast.success("Updated."); },
  });

  const txMut = useMutation({
    mutationFn: (data: any) => fetch("/api/transactions", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(data) }).then(r=>r.json()),
    onSuccess: () => { qc.invalidateQueries(); toast.success("Transaction completed!"); },
    onError: () => toast.error("Transaction failed."),
  });

  function openAdd() { setEditId(null); setForm({model:"",phone:"",balance:"",limit:"100000",category:"Personal",color:"#c0392b",notes:""}); setSelectedColor("#c0392b"); setShowModal(true); }
  function openEdit(a: Account) {
    setEditId(a.id);
    setForm({model:a.model,phone:a.phone,balance:String(a.balance),limit:String(a.limit),category:a.category,color:a.color,notes:a.notes||""});
    setSelectedColor(a.color); setShowModal(true);
  }
  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    saveMut.mutate({ model: form.model, phone: form.phone, balance: parseFloat(form.balance)||0, limit: parseFloat(form.limit)||100000, category: form.category, color: selectedColor, notes: form.notes, archived: false });
  }
  function handleTx(accountId: string, type: string) {
    const amt = parseFloat(amtInputs[accountId] || "0");
    if (type !== "Reset" && (!amt || amt <= 0)) { toast.error("Enter a valid amount."); return; }
    txMut.mutate({ accountId, type, amount: amt, notes: "" });
    setAmtInputs(prev => ({ ...prev, [accountId]: "" }));
  }

  const getStatus = (a: Account) => {
    if (a.archived) return { label: "Archived", cls: "bg-white/[0.05] text-[#888] border border-white/[0.07]" };
    const pct = a.limit ? (a.used / a.limit) * 100 : 0;
    if (pct >= 100) return { label: "Full", cls: "bg-red-900/20 text-[#e74c3c] border border-red-700/30" };
    if (pct >= 75) return { label: "High", cls: "bg-yellow-900/20 text-[#f39c12] border border-yellow-700/30" };
    return { label: "Active", cls: "bg-green-900/20 text-[#27ae60] border border-green-700/30" };
  };

  return (
    <div>
      <div className="font-display text-4xl tracking-[4px] text-white mb-1">GCASH DEVICE <span className="text-[#e74c3c]">LIMIT OVERVIEW</span></div>
      <p className="text-[#888] text-sm mb-6">Real-time account monitoring & transaction management</p>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Accounts" value={stats?.totalAccounts ?? 0} sub="Active accounts" icon="📱" />
        <StatCard label="Total Balance" value={`₱${fmt(stats?.totalBalance ?? 0)}`} sub="Combined balance" icon="💰" />
        <StatCard label="Total Used" value={`₱${fmt(stats?.totalUsed ?? 0)}`} sub="Amount deployed" icon="📤" />
        <StatCard label="Total Available" value={`₱${fmt(stats?.totalAvailable ?? 0)}`} sub="Remaining capacity" icon="✅" />
        <StatCard label="Monthly Profit" value={`₱${fmt(stats?.monthlyProfit ?? 0)}`} sub={stats?.monthLabel} icon="📈" />
        <StatCard label="Daily Profit" value={`₱${fmt(stats?.dailyProfit ?? 0)}`} sub="Today's earnings" icon="☀️" />
        <StatCard label="Highest Day" value={`₱${fmt(stats?.highestDay ?? 0)}`} sub={stats?.highestDate || "—"} icon="🏆" />
        <StatCard label="Transactions" value={stats?.totalTransactions ?? 0} sub="All time" icon="🔄" />
      </div>

      {/* Account Management */}
      <div className="flex items-center justify-between mb-3">
        <div className="font-display text-xl tracking-[2px] text-white">ACCOUNT <span className="text-[#e74c3c]">MANAGEMENT</span></div>
        <button onClick={openAdd} className="flex items-center gap-1.5 bg-[#c0392b] hover:bg-[#e74c3c] text-white px-3 py-2 rounded text-xs font-semibold tracking-wide transition-all">
          <Plus size={13} /> Add Account
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-3">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search accounts…" className="bg-white/[0.04] border border-white/[0.07] rounded px-3 py-1.5 text-xs text-white placeholder-[#555] focus:outline-none focus:border-red-700 w-44" />
        <select value={catFilter} onChange={e=>setCatFilter(e.target.value)} className="bg-white/[0.04] border border-white/[0.07] rounded px-2 py-1.5 text-xs text-[#888] focus:outline-none focus:border-red-700">
          <option value="">All Categories</option>{CATS.map(c=><option key={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="bg-white/[0.04] border border-white/[0.07] rounded px-2 py-1.5 text-xs text-[#888] focus:outline-none focus:border-red-700">
          <option value="">All Status</option>{["Active","Full","Archived"].map(s=><option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Accounts Table */}
      <div className="bg-[rgba(15,15,15,0.92)] border border-white/[0.07] rounded-lg overflow-hidden mb-6">
        <div className="overflow-x-auto max-h-[440px] overflow-y-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr>{["#","Model","Phone","Category","Used","Limit","Available","Usage","Status","Amount","Notes","Actions"].map(h=>(
                <th key={h} className="bg-[rgba(15,15,15,0.98)] text-[#888] text-[10px] font-semibold uppercase tracking-[1.2px] px-3 py-2.5 border-b border-white/[0.07] whitespace-nowrap sticky top-0 text-left">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {accounts.length === 0 ? (
                <tr><td colSpan={12} className="text-center py-12 text-[#555]"><div className="text-4xl mb-3 opacity-40">📱</div><div className="text-xs">No accounts yet. Add your first GCash account.</div></td></tr>
              ) : accounts.map((a, i) => {
                const avail = Math.max(0, a.limit - a.used);
                const pct = a.limit ? (a.used / a.limit) * 100 : 0;
                const st = getStatus(a);
                return (
                  <tr key={a.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-3 py-2 text-[#555] font-mono-num text-[11px]">{i+1}</td>
                    <td className="px-3 py-2"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full flex-shrink-0" style={{background:a.color}} /><span className="text-white">{a.model}</span></span></td>
                    <td className="px-3 py-2 font-mono-num text-[#888]">{a.phone}</td>
                    <td className="px-3 py-2"><span className="bg-white/[0.05] border border-white/[0.07] text-[#888] text-[10px] px-2 py-0.5 rounded-full">{a.category}</span></td>
                    <td className="px-3 py-2 font-mono-num text-[#27ae60]">₱{fmt(a.used)}</td>
                    <td className="px-3 py-2 font-mono-num text-[#888]">₱{fmt(a.limit)}</td>
                    <td className="px-3 py-2 font-mono-num text-white">₱{fmt(avail)}</td>
                    <td className="px-3 py-2"><ProgressBar pct={pct} /></td>
                    <td className="px-3 py-2"><span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${st.cls}`}>{st.label}</span></td>
                    <td className="px-3 py-2">
                      <input type="number" placeholder="₱0.00" value={amtInputs[a.id]||""} onChange={e=>setAmtInputs(p=>({...p,[a.id]:e.target.value}))}
                        className="w-24 bg-transparent border border-white/[0.07] rounded px-2 py-1 text-xs text-white font-mono-num text-right focus:outline-none focus:border-red-700" />
                    </td>
                    <td className="px-3 py-2 text-[#555] text-[11px] max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap">{a.notes||"—"}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <button onClick={()=>handleTx(a.id,"Add")} title="Add" className="bg-[#c0392b] hover:bg-[#e74c3c] text-white w-6 h-6 rounded flex items-center justify-center transition-colors"><Plus size={10}/></button>
                        <button onClick={()=>handleTx(a.id,"Deduct")} title="Deduct" className="bg-white/[0.06] hover:bg-white/[0.1] text-white w-6 h-6 rounded flex items-center justify-center transition-colors"><Minus size={10}/></button>
                        <button onClick={()=>handleTx(a.id,"Reset")} title="Reset" className="bg-white/[0.04] hover:bg-white/[0.08] text-[#888] w-6 h-6 rounded flex items-center justify-center transition-colors"><RefreshCw size={10}/></button>
                        <button onClick={()=>openEdit(a)} title="Edit" className="bg-white/[0.04] hover:bg-white/[0.08] text-[#888] w-6 h-6 rounded flex items-center justify-center transition-colors"><Edit2 size={10}/></button>
                        <button onClick={()=>archMut.mutate({id:a.id,archived:!a.archived})} title="Archive" className="bg-white/[0.04] hover:bg-white/[0.08] text-[#888] w-6 h-6 rounded flex items-center justify-center transition-colors"><Archive size={10}/></button>
                        <button onClick={()=>{if(confirm("Delete this account?"))delMut.mutate(a.id)}} title="Delete" className="bg-red-900/20 hover:bg-red-900/40 text-[#e74c3c] border border-red-700/30 w-6 h-6 rounded flex items-center justify-center transition-colors"><Trash2 size={10}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transactions */}
      <div className="flex items-center justify-between mb-3">
        <div className="font-display text-xl tracking-[2px] text-white">TRANSACTION <span className="text-[#e74c3c]">HISTORY</span></div>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        <input value={txSearch} onChange={e=>{setTxSearch(e.target.value);setTxPage(1)}} placeholder="Search transactions…" className="bg-white/[0.04] border border-white/[0.07] rounded px-3 py-1.5 text-xs text-white placeholder-[#555] focus:outline-none focus:border-red-700 w-44" />
        <select value={txType} onChange={e=>{setTxType(e.target.value);setTxPage(1)}} className="bg-white/[0.04] border border-white/[0.07] rounded px-2 py-1.5 text-xs text-[#888] focus:outline-none focus:border-red-700">
          <option value="">All Types</option>{["Add","Deduct","Reset"].map(t=><option key={t}>{t}</option>)}
        </select>
        <input type="date" value={txDate} onChange={e=>{setTxDate(e.target.value);setTxPage(1)}} className="bg-white/[0.04] border border-white/[0.07] rounded px-3 py-1.5 text-xs text-[#888] focus:outline-none focus:border-red-700" />
        <button onClick={()=>{setTxSearch("");setTxType("");setTxDate("");setTxPage(1)}} className="text-[#888] hover:text-white text-xs px-2">Clear</button>
      </div>
      <div className="bg-[rgba(15,15,15,0.92)] border border-white/[0.07] rounded-lg overflow-hidden mb-3">
        <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr>{["TX ID","Date","Time","Type","Phone","Account","Category","Amount","Bal After","Notes","Status"].map(h=>(
                <th key={h} className="bg-[rgba(15,15,15,0.98)] text-[#888] text-[10px] font-semibold uppercase tracking-[1.2px] px-3 py-2.5 border-b border-white/[0.07] whitespace-nowrap sticky top-0 text-left">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {!txData?.transactions?.length ? (
                <tr><td colSpan={11} className="text-center py-10 text-[#555] text-xs">No transactions found.</td></tr>
              ) : txData.transactions.map((t: Tx) => {
                const d = new Date(t.createdAt);
                return (
                  <tr key={t.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="px-3 py-2 font-mono-num text-[#555] text-[10px]">{t.id.slice(-8)}</td>
                    <td className="px-3 py-2 text-[#888] text-[11px]">{d.toLocaleDateString("en-PH")}</td>
                    <td className="px-3 py-2 text-[#888] text-[11px]">{d.toLocaleTimeString("en-PH",{hour:"2-digit",minute:"2-digit"})}</td>
                    <td className="px-3 py-2"><span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${t.type==="Add"?"bg-red-900/20 text-[#e74c3c] border-red-700/30":t.type==="Deduct"?"bg-green-900/20 text-[#27ae60] border-green-700/30":"bg-white/[0.05] text-[#888] border-white/[0.07]"}`}>{t.type}</span></td>
                    <td className="px-3 py-2 font-mono-num text-[#888]">{t.phone}</td>
                    <td className="px-3 py-2 text-white">{t.account}</td>
                    <td className="px-3 py-2 text-[#888]">{t.category}</td>
                    <td className={`px-3 py-2 font-mono-num font-semibold ${t.type==="Add"?"text-[#27ae60]":t.type==="Deduct"?"text-[#e74c3c]":"text-[#888]"}`}>{t.type==="Add"?"+":t.type==="Deduct"?"-":""}₱{fmt(t.amount)}</td>
                    <td className="px-3 py-2 font-mono-num text-white">₱{fmt(t.balAfter)}</td>
                    <td className="px-3 py-2 text-[#555] text-[11px]">{t.notes||"—"}</td>
                    <td className="px-3 py-2"><span className="bg-green-900/20 text-[#27ae60] border border-green-700/30 text-[10px] px-2 py-0.5 rounded-full">Completed</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {/* Pagination */}
      {txData?.pages > 1 && (
        <div className="flex justify-end gap-1 pb-2">
          <button disabled={txPage<=1} onClick={()=>setTxPage(p=>p-1)} className="w-7 h-7 flex items-center justify-center border border-white/[0.07] rounded text-[#888] disabled:opacity-30 hover:border-red-700 hover:text-[#e74c3c] transition-colors"><ChevronLeft size={12}/></button>
          {Array.from({length:txData.pages},(_,i)=>i+1).map(p=>(
            <button key={p} onClick={()=>setTxPage(p)} className={`w-7 h-7 flex items-center justify-center border rounded text-xs transition-colors ${p===txPage?"bg-[#c0392b] border-[#c0392b] text-white":"border-white/[0.07] text-[#888] hover:border-red-700 hover:text-[#e74c3c]"}`}>{p}</button>
          ))}
          <button disabled={txPage>=txData.pages} onClick={()=>setTxPage(p=>p+1)} className="w-7 h-7 flex items-center justify-center border border-white/[0.07] rounded text-[#888] disabled:opacity-30 hover:border-red-700 hover:text-[#e74c3c] transition-colors"><ChevronRight size={12}/></button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur p-4">
          <div className="bg-[#111] border border-white/[0.07] rounded-xl p-7 w-full max-w-[480px] animate-in fade-in zoom-in-95 duration-200">
            <div className="font-display text-2xl tracking-[2px] text-white mb-5">{editId?"EDIT":"ADD"} <span className="text-[#e74c3c]">ACCOUNT</span></div>
            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[10px] uppercase tracking-widest text-[#888] mb-1">Phone Model</label>
                  <input value={form.model} onChange={e=>setForm(f=>({...f,model:e.target.value}))} required placeholder="e.g. Samsung A34" className="w-full bg-white/[0.04] border border-white/[0.07] rounded px-3 py-2 text-sm text-white placeholder-[#555] focus:outline-none focus:border-red-700" /></div>
                <div><label className="block text-[10px] uppercase tracking-widest text-[#888] mb-1">Phone Number</label>
                  <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} required placeholder="09XXXXXXXXX" className="w-full bg-white/[0.04] border border-white/[0.07] rounded px-3 py-2 text-sm text-white placeholder-[#555] focus:outline-none focus:border-red-700" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[10px] uppercase tracking-widest text-[#888] mb-1">Starting Balance (₱)</label>
                  <input type="number" value={form.balance} onChange={e=>setForm(f=>({...f,balance:e.target.value}))} placeholder="0" className="w-full bg-white/[0.04] border border-white/[0.07] rounded px-3 py-2 text-sm text-white font-mono-num focus:outline-none focus:border-red-700" /></div>
                <div><label className="block text-[10px] uppercase tracking-widest text-[#888] mb-1">GCash Limit (₱)</label>
                  <input type="number" value={form.limit} onChange={e=>setForm(f=>({...f,limit:e.target.value}))} placeholder="100000" className="w-full bg-white/[0.04] border border-white/[0.07] rounded px-3 py-2 text-sm text-white font-mono-num focus:outline-none focus:border-red-700" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[10px] uppercase tracking-widest text-[#888] mb-1">Category</label>
                  <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} className="w-full bg-[#111] border border-white/[0.07] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-red-700">
                    {CATS.map(c=><option key={c}>{c}</option>)}
                  </select></div>
                <div><label className="block text-[10px] uppercase tracking-widest text-[#888] mb-1">Color</label>
                  <div className="flex gap-2 mt-1">{ACCOUNT_COLORS.map(c=>(
                    <button key={c} type="button" onClick={()=>setSelectedColor(c)} className="w-6 h-6 rounded-full transition-all flex-shrink-0" style={{background:c, border:selectedColor===c?"2px solid white":"2px solid transparent", transform:selectedColor===c?"scale(1.2)":"scale(1)"}} />
                  ))}</div></div>
              </div>
              <div><label className="block text-[10px] uppercase tracking-widest text-[#888] mb-1">Notes</label>
                <input value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Optional notes…" className="w-full bg-white/[0.04] border border-white/[0.07] rounded px-3 py-2 text-sm text-white placeholder-[#555] focus:outline-none focus:border-red-700" /></div>
              <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.07]">
                <button type="button" onClick={()=>setShowModal(false)} className="px-4 py-2 border border-white/[0.07] text-[#888] hover:text-white rounded text-sm transition-colors">Cancel</button>
                <button type="submit" disabled={saveMut.isPending} className="px-5 py-2 bg-[#c0392b] hover:bg-[#e74c3c] text-white rounded text-sm font-semibold transition-all disabled:opacity-50">
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
