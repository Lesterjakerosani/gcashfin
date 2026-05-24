"use client";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Save, LogOut, AlertTriangle, Shield, Users, User, Plus, Trash2, Eye, EyeOff } from "lucide-react";

type Panel = "users" | "profile" | "danger";

const PANELS: { key: Panel; label: string; icon: any }[] = [
  { key: "users", label: "User Management", icon: Users },
  { key: "profile", label: "My Profile", icon: User },
  { key: "danger", label: "Danger Zone", icon: AlertTriangle },
];

type SysUser = { id: string; name: string; email: string; role: string; createdAt: string };

export default function AdminPage() {
  const { data: session } = useSession();
  const qc = useQueryClient();
  const [panel, setPanel] = useState<Panel>("users");

  const [name, setName] = useState(session?.user?.name || "");
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confPw, setConfPw] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [addForm, setAddForm] = useState({ name: "", email: "", password: "", role: "admin" });
  const [showAddForm, setShowAddForm] = useState(false);

  const isAdmin = (session?.user as any)?.role === "admin";

  const { data: users = [] } = useQuery<SysUser[]>({
    queryKey: ["admin-users"],
    queryFn: () => fetch("/api/admin/users").then(r => r.json()),
    enabled: isAdmin,
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "displayName", value: name }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
    },
    onSuccess: () => toast.success("Display name updated."),
    onError: (e: any) => toast.error(e?.message || "Failed to save."),
  });

  const pwMut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: oldPw, newPassword: newPw, confirmPassword: confPw }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed");
    },
    onSuccess: () => {
      toast.success("Password updated!");
      setOldPw(""); setNewPw(""); setConfPw("");
    },
    onError: (e: any) => toast.error(e?.message || "Password update failed."),
  });

  const addUserMut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed");
      return body;
    },
    onSuccess: () => {
      toast.success("User created!");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setAddForm({ name: "", email: "", password: "", role: "admin" });
      setShowAddForm(false);
    },
    onError: (e: any) => toast.error(e?.message || "Failed to create user."),
  });

  const deleteUserMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed");
    },
    onSuccess: () => {
      toast.success("User deleted.");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to delete user."),
  });

  function handleChangePw(e: React.FormEvent) {
    e.preventDefault();
    if (!oldPw || !newPw || !confPw) { toast.error("Fill all fields."); return; }
    if (newPw !== confPw) { toast.error("Passwords do not match."); return; }
    if (newPw.length < 6) { toast.error("Minimum 6 characters."); return; }
    pwMut.mutate();
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="card p-10 text-center max-w-sm">
          <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield size={28} className="text-red-500" />
          </div>
          <div className="text-base font-semibold text-gray-900 dark:text-white mb-1">Admin Access Only</div>
          <p className="text-sm text-gray-500 dark:text-slate-400">You don&apos;t have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Admin Panel</h1>
        <p className="page-subtitle">System administration and user management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-5">
        {/* Sidebar Nav */}
        <div className="card p-2 h-fit">
          {PANELS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setPanel(key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 ${
                panel === key
                  ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm"
                  : "text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white"
              }`}>
              <Icon size={15} /> {label}
            </button>
          ))}
          <div className="border-t border-gray-100 dark:border-slate-700 mt-2 pt-2">
            <button onClick={() => signOut({ callbackUrl: "/auth/login" })}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </div>

        <div>
          {/* User Management */}
          {panel === "users" && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="section-title">User Management</h2>
                <button onClick={() => setShowAddForm(v => !v)} className="btn-primary text-xs px-3 py-2">
                  <Plus size={13} /> Add User
                </button>
              </div>

              {showAddForm && (
                <div className="mb-5 p-4 bg-gray-50 dark:bg-slate-700/30 border border-gray-200 dark:border-slate-600 rounded-xl">
                  <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">New User</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="label">Name</label>
                      <input value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Full name" className="input-field" />
                    </div>
                    <div>
                      <label className="label">Email</label>
                      <input type="email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="email@example.com" className="input-field" />
                    </div>
                    <div>
                      <label className="label">Password</label>
                      <input type="password" value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))}
                        placeholder="Min 6 characters" className="input-field" />
                    </div>
                    <div>
                      <label className="label">Role</label>
                      <select value={addForm.role} onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))} className="select-field">
                        <option value="admin">Admin</option>
                        <option value="user">User</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => addUserMut.mutate()} disabled={addUserMut.isPending} className="btn-primary text-sm">
                      <Plus size={13} /> {addUserMut.isPending ? "Creating…" : "Create User"}
                    </button>
                    <button onClick={() => setShowAddForm(false)} className="btn-secondary text-sm">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="table-container">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {["Name", "Email", "Role", "Joined", "Actions"].map(h => (
                        <th key={h} className="th">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-8 text-gray-400 dark:text-slate-500 text-sm">No users found.</td></tr>
                    ) : users.map(u => (
                      <tr key={u.id} className="tr-hover">
                        <td className="td">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                              {u.name[0].toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">{u.name}</span>
                            {u.id === (session?.user as any)?.id && (
                              <span className="badge-gray text-[10px]">you</span>
                            )}
                          </div>
                        </td>
                        <td className="td text-gray-500 dark:text-slate-400">{u.email}</td>
                        <td className="td">
                          <span className={u.role === "admin" ? "badge-blue" : "badge-gray"}>
                            {u.role}
                          </span>
                        </td>
                        <td className="td text-gray-400 dark:text-slate-500">
                          {new Date(u.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}
                        </td>
                        <td className="td">
                          <button
                            onClick={() => { if (confirm(`Delete user "${u.name}"?`)) deleteUserMut.mutate(u.id); }}
                            disabled={u.id === (session?.user as any)?.id}
                            className="text-gray-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title={u.id === (session?.user as any)?.id ? "Cannot delete yourself" : "Delete user"}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* My Profile */}
          {panel === "profile" && (
            <div className="card p-6 space-y-5">
              <h2 className="section-title">My Profile</h2>
              <div className="flex items-center gap-4 pb-4 border-b border-gray-100 dark:border-slate-700">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
                  {(session?.user?.name || "A")[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">{session?.user?.name}</div>
                  <div className="text-sm text-gray-500 dark:text-slate-400">{session?.user?.email}</div>
                  <span className="badge-blue mt-1 text-[10px]">{(session?.user as any)?.role || "admin"}</span>
                </div>
              </div>

              <div>
                <label className="label">Display Name</label>
                <div className="flex gap-2">
                  <input value={name} onChange={e => setName(e.target.value)} className="input-field flex-1" />
                  <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="btn-primary">
                    <Save size={14} /> Save
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-slate-700 pt-5">
                <h3 className="section-title mb-4">Change Password</h3>
                <form onSubmit={handleChangePw} className="space-y-3">
                  {[
                    { label: "Current Password", value: oldPw, set: setOldPw },
                    { label: "New Password", value: newPw, set: setNewPw },
                    { label: "Confirm New Password", value: confPw, set: setConfPw },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="label">{f.label}</label>
                      <div className="relative">
                        <input type={showPw ? "text" : "password"} value={f.value} onChange={e => f.set(e.target.value)} required className="input-field pr-10" />
                        {f.label === "Current Password" && (
                          <button type="button" onClick={() => setShowPw(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors">
                            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button type="submit" disabled={pwMut.isPending} className="btn-primary">
                    <Save size={14} /> {pwMut.isPending ? "Updating…" : "Update Password"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Danger Zone */}
          {panel === "danger" && (
            <div className="card border-red-200 dark:border-red-900/40 p-6">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={18} className="text-red-500" />
                <h2 className="text-base font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>
              </div>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-5">These actions are irreversible. Admin eyes only.</p>
              <div className="space-y-3">
                {[
                  { label: "Clear All Transactions", sub: "Delete all transaction history permanently" },
                  { label: "Clear Salary Entries", sub: "Delete all salary and expense records permanently" },
                  { label: "Delete All Accounts", sub: "Remove all GCash account records permanently" },
                  { label: "Full System Reset", sub: "Delete ALL data across the entire system" },
                ].map(b => (
                  <div key={b.label} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-slate-700/50 last:border-0">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-gray-800 dark:text-slate-200">{b.label}</div>
                        <div className="text-xs text-gray-500 dark:text-slate-400">{b.sub}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => toast.error("Contact your database admin to perform this operation.")}
                      className="btn-danger text-xs px-3 py-1.5 ml-4 flex-shrink-0"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
