"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Edit2, Plus, Search, X, Users, CreditCard, ArrowLeftRight, DollarSign, Check } from "lucide-react";
import toast from "react-hot-toast";

type User = {
  id: string; name: string; email: string; role: string; createdAt: string;
  _count: { accounts: number; transactions: number; salaryEntries: number };
};

const ROLES = ["user", "admin"];

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#242526] border border-gray-200 dark:border-[#3E4042] rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-[#3E4042]">
          <h3 className="font-semibold text-gray-900 dark:text-[#E4E6EB]">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#3A3B3C] text-gray-400 transition-colors"><X size={16} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user" });
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "user", password: "" });

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["admin-users"],
    queryFn: () => fetch("/api/admin/users").then(r => r.json()),
  });

  const addMut = useMutation({
    mutationFn: (data: any) => fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: (d) => { if (d.error) { toast.error(d.error); return; } qc.invalidateQueries({ queryKey: ["admin-users"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); toast.success("User created!"); setShowAdd(false); setForm({ name: "", email: "", password: "", role: "user" }); },
  });

  const editMut = useMutation({
    mutationFn: (data: any) => fetch("/api/admin/users", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: (d) => { if (d.error) { toast.error(d.error); return; } qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("User updated!"); setEditUser(null); },
  });

  const delMut = useMutation({
    mutationFn: (id: string) => fetch("/api/admin/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }).then(r => r.json()),
    onSuccess: (d) => { if (d.error) { toast.error(d.error); return; } qc.invalidateQueries({ queryKey: ["admin-users"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); toast.success("User deleted."); },
  });

  const filtered = users.filter(u => {
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  function openEdit(u: User) { setEditUser(u); setEditForm({ name: u.name, email: u.email, role: u.role, password: "" }); }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">{users.filter(u => u.role === "user").length} registered users</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary gap-1.5">
          <Plus size={14} /> Add User
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…" className="input-field !pl-9 !w-52 !py-2" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="select-field !w-auto !py-2">
          <option value="all">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        {(search || roleFilter !== "all") && (
          <button onClick={() => { setSearch(""); setRoleFilter("all"); }} className="btn-ghost text-xs py-2">Clear</button>
        )}
      </div>

      {/* Table */}
      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["#", "Name", "Email", "Role", "Accounts", "Transactions", "Salary", "Joined", "Actions"].map(h => (
                  <th key={h} className="th whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="text-center py-10 text-gray-400 text-sm">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10 text-gray-400 text-sm">No users found.</td></tr>
              ) : filtered.map((u, i) => (
                <tr key={u.id} className="tr-hover">
                  <td className="td text-gray-400 text-xs">{i + 1}</td>
                  <td className="td">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${u.role === "admin" ? "bg-gradient-to-br from-red-400 to-orange-500" : "bg-gradient-to-br from-blue-400 to-blue-600"}`}>
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-[#E4E6EB]">{u.name}</span>
                    </div>
                  </td>
                  <td className="td text-gray-500 dark:text-[#B0B3B8] text-xs">{u.email}</td>
                  <td className="td"><span className={u.role === "admin" ? "badge-red" : "badge-green"}>{u.role}</span></td>
                  <td className="td"><div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400"><CreditCard size={10} />{u._count.accounts}</div></td>
                  <td className="td"><div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400"><ArrowLeftRight size={10} />{u._count.transactions}</div></td>
                  <td className="td"><div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400"><DollarSign size={10} />{u._count.salaryEntries}</div></td>
                  <td className="td text-xs text-gray-400 dark:text-[#B0B3B8]">{new Date(u.createdAt).toLocaleDateString("en-PH")}</td>
                  <td className="td">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(u)} className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-colors"><Edit2 size={12} /></button>
                      {u.role !== "admin" && (
                        <button onClick={() => { if (confirm(`Delete ${u.name}?`)) delMut.mutate(u.id); }} className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors"><Trash2 size={12} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAdd && (
        <Modal title="Add New User" onClose={() => setShowAdd(false)}>
          <form onSubmit={e => { e.preventDefault(); addMut.mutate(form); }} className="space-y-3">
            <div><label className="label">Full Name</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="John Doe" className="input-field" /></div>
            <div><label className="label">Email</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required placeholder="john@example.com" className="input-field" /></div>
            <div><label className="label">Password</label><input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required placeholder="Min. 6 characters" className="input-field" /></div>
            <div><label className="label">Role</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="select-field">
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={addMut.isPending} className="btn-primary flex-1">{addMut.isPending ? "Creating…" : "Create User"}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <Modal title={`Edit — ${editUser.name}`} onClose={() => setEditUser(null)}>
          <form onSubmit={e => { e.preventDefault(); editMut.mutate({ id: editUser.id, ...editForm }); }} className="space-y-3">
            <div><label className="label">Full Name</label><input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required className="input-field" /></div>
            <div><label className="label">Email</label><input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} required className="input-field" /></div>
            <div><label className="label">Role</label>
              <select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} className="select-field">
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div><label className="label">New Password <span className="text-gray-400 font-normal">(leave blank to keep)</span></label><input type="password" value={editForm.password} onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))} placeholder="Leave blank to keep current" className="input-field" /></div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setEditUser(null)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={editMut.isPending} className="btn-primary flex-1 gap-1.5"><Check size={14} />{editMut.isPending ? "Saving…" : "Save Changes"}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
