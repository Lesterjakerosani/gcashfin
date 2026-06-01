"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Search, FileText, CreditCard, ArrowLeftRight, DollarSign } from "lucide-react";
import toast from "react-hot-toast";
import { fmt } from "@/lib/utils";

type RecordType = "accounts" | "transactions" | "salary";

const TABS: { key: RecordType; label: string; icon: any }[] = [
  { key: "accounts",     label: "GCash Accounts", icon: CreditCard },
  { key: "transactions", label: "Transactions",   icon: ArrowLeftRight },
  { key: "salary",       label: "Salary Entries", icon: DollarSign },
];

export default function AdminRecordsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<RecordType>("accounts");
  const [search, setSearch] = useState("");

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["admin-records", tab, search],
    queryFn: () => fetch(`/api/admin/records?type=${tab}&search=${encodeURIComponent(search)}`).then(r => r.json()),
  });

  const delMut = useMutation({
    mutationFn: ({ id, type }: { id: string; type: string }) =>
      fetch("/api/admin/records", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, type: type.replace("s", "") }) }).then(r => r.json()),
    onSuccess: (d) => {
      if (d.error) { toast.error(d.error); return; }
      qc.invalidateQueries({ queryKey: ["admin-records"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Record deleted.");
    },
  });

  const tabSingular = tab === "accounts" ? "account" : tab === "transactions" ? "transaction" : "salary";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title flex items-center gap-2"><FileText size={20} className="text-red-500" />Records Management</h1>
        <p className="page-subtitle">View, search, and manage all system records</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-[#3A3B3C] p-1 rounded-xl w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => { setTab(key); setSearch(""); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === key ? "bg-white dark:bg-[#242526] text-gray-900 dark:text-[#E4E6EB] shadow-sm" : "text-gray-500 dark:text-[#B0B3B8] hover:text-gray-700"}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative w-64">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${tab}…`} className="input-field !pl-9 !py-2" />
      </div>

      {/* Records Table */}
      <div className="table-container">
        <div className="px-5 py-3 border-b border-gray-100 dark:border-[#3E4042] flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600 dark:text-[#B0B3B8]">{records.length} {tab}</span>
        </div>
        <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10">
              {tab === "accounts" && (
                <tr>{["Owner", "Model", "Phone", "Category", "Used", "Limit", "Available", "Status", "Created", "Action"].map(h => <th key={h} className="th whitespace-nowrap">{h}</th>)}</tr>
              )}
              {tab === "transactions" && (
                <tr>{["Owner", "Account", "Phone", "Type", "Amount", "Bal After", "Notes", "Date", "Action"].map(h => <th key={h} className="th whitespace-nowrap">{h}</th>)}</tr>
              )}
              {tab === "salary" && (
                <tr>{["Owner", "Date", "Type", "Amount", "Category", "Notes", "Created", "Action"].map(h => <th key={h} className="th whitespace-nowrap">{h}</th>)}</tr>
              )}
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={10} className="text-center py-10 text-gray-400 text-sm">Loading…</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-10 text-gray-400 text-sm">No records found.</td></tr>
              ) : records.map((r: any) => (
                <tr key={r.id} className="tr-hover">
                  <td className="td">
                    <div>
                      <p className="text-xs font-medium text-gray-900 dark:text-[#E4E6EB]">{r.user?.name}</p>
                      <p className="text-[10px] text-gray-400 dark:text-[#B0B3B8]">{r.user?.email}</p>
                    </div>
                  </td>
                  {tab === "accounts" && <>
                    <td className="td font-medium text-gray-900 dark:text-[#E4E6EB]">{r.model}</td>
                    <td className="td font-mono text-xs">{r.phone}</td>
                    <td className="td"><span className="badge-gray">{r.category}</span></td>
                    <td className="td font-mono text-emerald-600 dark:text-emerald-400">₱{fmt(r.used)}</td>
                    <td className="td font-mono text-gray-500">₱{fmt(r.limit)}</td>
                    <td className="td font-mono text-gray-900 dark:text-[#E4E6EB]">₱{fmt(Math.max(0, r.limit - r.used))}</td>
                    <td className="td"><span className={r.archived ? "badge-gray" : "badge-green"}>{r.archived ? "Archived" : "Active"}</span></td>
                    <td className="td text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString("en-PH")}</td>
                  </>}
                  {tab === "transactions" && <>
                    <td className="td font-medium text-gray-900 dark:text-[#E4E6EB]">{r.account}</td>
                    <td className="td font-mono text-xs">{r.phone}</td>
                    <td className="td"><span className={r.type === "Add" ? "badge-green" : r.type === "Deduct" ? "badge-red" : "badge-gray"}>{r.type}</span></td>
                    <td className={`td font-mono ${r.type === "Add" ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>₱{fmt(r.amount)}</td>
                    <td className="td font-mono text-gray-900 dark:text-[#E4E6EB]">₱{fmt(r.balAfter)}</td>
                    <td className="td text-xs text-gray-400">{r.notes || "—"}</td>
                    <td className="td text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString("en-PH")}</td>
                  </>}
                  {tab === "salary" && <>
                    <td className="td text-xs">{r.date}</td>
                    <td className="td"><span className={r.type === "expense" ? "badge-red" : "badge-green"}>{r.type}</span></td>
                    <td className={`td font-mono ${r.type === "expense" ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"}`}>₱{fmt(r.amount)}</td>
                    <td className="td text-xs text-gray-400">{r.category}</td>
                    <td className="td text-xs text-gray-400">{r.notes || "—"}</td>
                    <td className="td text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString("en-PH")}</td>
                  </>}
                  <td className="td">
                    <button onClick={() => { if (confirm("Delete this record?")) delMut.mutate({ id: r.id, type: tab }); }}
                      className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors">
                      <Trash2 size={12} />
                    </button>
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
