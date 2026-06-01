"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Activity, ChevronLeft, ChevronRight, Trash2, LogIn, LogOut, Edit2, Plus, Settings, FileText } from "lucide-react";
import toast from "react-hot-toast";

function getActionIcon(action: string) {
  if (action.toLowerCase().includes("log")) return <LogIn size={12} className="text-blue-500" />;
  if (action.toLowerCase().includes("delete")) return <Trash2 size={12} className="text-red-500" />;
  if (action.toLowerCase().includes("edit") || action.toLowerCase().includes("update")) return <Edit2 size={12} className="text-amber-500" />;
  if (action.toLowerCase().includes("creat") || action.toLowerCase().includes("add")) return <Plus size={12} className="text-emerald-500" />;
  if (action.toLowerCase().includes("setting")) return <Settings size={12} className="text-purple-500" />;
  return <FileText size={12} className="text-gray-400" />;
}

function getActionColor(action: string) {
  if (action.toLowerCase().includes("log")) return "bg-blue-100 dark:bg-blue-900/30";
  if (action.toLowerCase().includes("delete")) return "bg-red-100 dark:bg-red-900/30";
  if (action.toLowerCase().includes("edit") || action.toLowerCase().includes("update")) return "bg-amber-100 dark:bg-amber-900/30";
  if (action.toLowerCase().includes("creat") || action.toLowerCase().includes("add")) return "bg-emerald-100 dark:bg-emerald-900/30";
  return "bg-gray-100 dark:bg-[#3A3B3C]";
}

export default function AdminActivityPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);

  const { data } = useQuery({
    queryKey: ["admin-activity", page],
    queryFn: () => fetch(`/api/admin/activity?page=${page}`).then(r => r.json()),
    refetchInterval: 15000,
  });

  const clearMut = useMutation({
    mutationFn: () => fetch("/api/admin/activity", { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-activity"] }); toast.success("Activity logs cleared."); setPage(1); },
  });

  const logs = data?.logs || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2"><Activity size={20} className="text-red-500" />Activity Monitoring</h1>
          <p className="page-subtitle">{data?.total ?? 0} total events recorded · auto-refreshes every 15s</p>
        </div>
        <button onClick={() => { if (confirm("Clear all activity logs?")) clearMut.mutate(); }}
          className="btn-secondary text-xs gap-1.5 text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20">
          <Trash2 size={13} /> Clear Logs
        </button>
      </div>

      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["#", "Action", "User", "Email", "Details", "Date & Time"].map(h => (
                  <th key={h} className="th whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">No activity recorded yet.</td></tr>
              ) : logs.map((log: any, i: number) => (
                <tr key={log.id} className="tr-hover">
                  <td className="td text-gray-400 text-xs">{(page - 1) * 20 + i + 1}</td>
                  <td className="td">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${getActionColor(log.action)}`}>
                      {getActionIcon(log.action)}
                      <span className="text-xs font-medium text-gray-700 dark:text-[#E4E6EB]">{log.action}</span>
                    </div>
                  </td>
                  <td className="td font-medium text-gray-900 dark:text-[#E4E6EB]">{log.userName}</td>
                  <td className="td text-xs text-gray-500 dark:text-[#B0B3B8]">{log.userEmail}</td>
                  <td className="td text-xs text-gray-400 dark:text-[#B0B3B8] max-w-[200px] truncate">{log.details || "—"}</td>
                  <td className="td text-xs text-gray-400 dark:text-[#B0B3B8] whitespace-nowrap">
                    <div>{new Date(log.createdAt).toLocaleDateString("en-PH")}</div>
                    <div className="font-mono">{new Date(log.createdAt).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {data?.pages > 1 && (
        <div className="flex justify-end gap-1">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-[#3E4042] text-gray-500 disabled:opacity-30 hover:border-gray-300 transition-colors">
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: Math.min(data.pages, 7) }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 flex items-center justify-center rounded-lg border text-xs font-medium transition-colors ${p === page ? "bg-gray-900 dark:bg-white border-gray-900 dark:border-white text-white dark:text-gray-900" : "border-gray-200 dark:border-[#3E4042] text-gray-500 hover:border-gray-300"}`}>{p}</button>
          ))}
          <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-[#3E4042] text-gray-500 disabled:opacity-30 hover:border-gray-300 transition-colors">
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
