"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Users, CreditCard, ArrowLeftRight, DollarSign } from "lucide-react";
import toast from "react-hot-toast";

type User = {
  id: string; name: string; email: string; role: string; createdAt: string;
  _count: { accounts: number; transactions: number; salaryEntries: number };
};

export default function AdminUsersPage() {
  const qc = useQueryClient();

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["admin-users"],
    queryFn: () => fetch("/api/admin/users").then(r => r.json()),
  });

  const delMut = useMutation({
    mutationFn: (id: string) =>
      fetch("/api/admin/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }).then(r => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return; }
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("User deleted.");
    },
    onError: () => toast.error("Failed to delete user."),
  });

  const regularUsers = users.filter(u => u.role !== "admin");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">User Management</h1>
        <p className="page-subtitle">{regularUsers.length} registered user{regularUsers.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="table-container">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-[#3E4042] flex items-center gap-2">
          <Users size={15} className="text-red-500" />
          <h2 className="section-title">All Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["#", "Name", "Email", "Accounts", "Transactions", "Salary Entries", "Joined", "Action"].map(h => (
                  <th key={h} className="th whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400 dark:text-[#B0B3B8] text-sm">Loading…</td></tr>
              ) : regularUsers.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400 dark:text-[#B0B3B8] text-sm">No users registered yet.</td></tr>
              ) : regularUsers.map((u, i) => (
                <tr key={u.id} className="tr-hover">
                  <td className="td text-gray-400 dark:text-[#B0B3B8] text-xs">{i + 1}</td>
                  <td className="td font-medium text-gray-900 dark:text-[#E4E6EB]">{u.name}</td>
                  <td className="td text-gray-500 dark:text-[#B0B3B8] text-xs">{u.email}</td>
                  <td className="td">
                    <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                      <CreditCard size={11} /> {u._count.accounts}
                    </div>
                  </td>
                  <td className="td">
                    <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
                      <ArrowLeftRight size={11} /> {u._count.transactions}
                    </div>
                  </td>
                  <td className="td">
                    <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                      <DollarSign size={11} /> {u._count.salaryEntries}
                    </div>
                  </td>
                  <td className="td text-xs text-gray-400 dark:text-[#B0B3B8]">
                    {new Date(u.createdAt).toLocaleDateString("en-PH")}
                  </td>
                  <td className="td">
                    <button
                      onClick={() => { if (confirm(`Delete ${u.name}? This will remove all their data.`)) delMut.mutate(u.id); }}
                      className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-500 flex items-center justify-center transition-colors"
                      title="Delete user"
                    >
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
