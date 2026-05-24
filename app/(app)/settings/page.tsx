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

  // Profile state
  const [name, setName] = useState(session?.user?.name || "");
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confPw, setConfPw] = useState("");
  const [showPw, setShowPw] = useState(false);

  // Add user state
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
        <div className="text-center">
          <Shield size={40} className="text-[#e74c3c] mx-auto mb-3" />
          <div className="text-white font-semibold mb-1">Admin Access Only</div>
          <p className="text-[#888] text-sm">You don&apos;t have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="font-display text-4xl tracking-[4px] text-white mb-1">
        ADMIN <span className="text-[#e74c3c]">PANEL</span>
      </div>
      <p className="text-[#888] text-sm mb-6">System administration and user management</p>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-5">
        {/* Nav */}
        <div className="bg-[rgba(15,15,15,0.92)] border border-white/[0.07] rounded-lg p-3 h-fit">
          {PANELS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setPanel(key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded text-sm transition-all mb-0.5 ${panel === key ? "text-[#e74c3c] bg-[rgba(192,57,43,0.15)]" : "text-[#888] hover:text-white hover:bg-white/[0.04]"}`}>
              <Icon size={14} /> {label}
            </button>
          ))}
          <div className="border-t border-white/[0.07] mt-2 pt-2">
            <button onClick={() => signOut({ callbackUrl: "/auth/login" })}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded text-sm text-[#888] hover:text-[#e74c3c] transition-colors">
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>

        <div>
          {/* User Management */}
          {panel === "users" && (
            <div className="bg-[rgba(15,15,15,0.92)] border border-white/[0.07] rounded-lg p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="font-display text-xl tracking-[2px] text-white">USER <span className="text-[#e74c3c]">MANAGEMENT</span></div>
                <button onClick={() => setShowAddForm(v => !v)}
                  className="flex items-center gap-1.5 bg-[#c0392b] hover:bg-[#e74c3c] text-white px-3 py-2 rounded text-xs font-semibold transition-all">
                  <Plus size={12} /> Add User
                </button>
              </div>

              {/* Add User Form */}
              {showAddForm && (
                <div className="mb-5 p-4 bg-white/[0.03] border border-white/[0.07] rounded-lg">
                  <div className="text-xs uppercase tracking-widest text-[#888] mb-3">New User</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-[#888] mb-1">Name</label>
                      <input value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Full name" className="w-full bg-white/[0.04] border border-white/[0.07] rounded px-3 py-2 text-sm text-white placeholder-[#555] focus:outline-none focus:border-red-700" />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-[#888] mb-1">Email</label>
                      <input type="email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="email@example.com" className="w-full bg-white/[0.04] border border-white/[0.07] rounded px-3 py-2 text-sm text-white placeholder-[#555] focus:outline-none focus:border-red-700" />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-[#888] mb-1">Password</label>
                      <input type="password" value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))}
                        placeholder="Min 6 characters" className="w-full bg-white/[0.04] border border-white/[0.07] rounded px-3 py-2 text-sm text-white placeholder-[#555] focus:outline-none focus:border-red-700" />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-[#888] mb-1">Role</label>
                      <select value={addForm.role} onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))}
                        className="w-full bg-[#111] border border-white/[0.07] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-red-700">
                        <option value="admin">Admin</option>
                        <option value="user">User</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => addUserMut.mutate()} disabled={addUserMut.isPending}
                      className="flex items-center gap-1.5 bg-[#c0392b] hover:bg-[#e74c3c] text-white px-4 py-2 rounded text-sm transition-all disabled:opacity-50">
                      <Plus size={12} /> {addUserMut.isPending ? "Creating…" : "Create User"}
                    </button>
                    <button onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 border border-white/[0.07] text-[#888] hover:text-white rounded text-sm transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Users Table */}
              <div className="overflow-hidden rounded-lg border border-white/[0.07]">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      {["Name", "Email", "Role", "Joined", "Actions"].map(h => (
                        <th key={h} className="bg-[rgba(10,10,10,0.9)] text-[#888] text-[10px] font-semibold uppercase tracking-[1.2px] px-4 py-2.5 border-b border-white/[0.07] text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-8 text-[#555] text-xs">No users found.</td></tr>
                    ) : users.map(u => (
                      <tr key={u.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#c0392b] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                              {u.name[0].toUpperCase()}
                            </div>
                            <span className="text-white">{u.name}</span>
                            {u.id === (session?.user as any)?.id && (
                              <span className="text-[10px] text-[#555] bg-white/[0.04] px-1.5 py-0.5 rounded">you</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#888] text-xs">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${u.role === "admin" ? "bg-[rgba(192,57,43,0.15)] text-[#e74c3c] border-red-700/30" : "bg-white/[0.05] text-[#888] border-white/[0.07]"}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#555] text-xs">
                          {new Date(u.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => { if (confirm(`Delete user "${u.name}"?`)) deleteUserMut.mutate(u.id); }}
                            disabled={u.id === (session?.user as any)?.id}
                            className="text-[#555] hover:text-[#e74c3c] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
            <div className="bg-[rgba(15,15,15,0.92)] border border-white/[0.07] rounded-lg p-6 space-y-5">
              <div className="font-display text-xl tracking-[2px] text-white">MY <span className="text-[#e74c3c]">PROFILE</span></div>
              <div className="flex items-center gap-4 pb-4 border-b border-white/[0.07]">
                <div className="w-16 h-16 rounded-full bg-[#c0392b] flex items-center justify-center text-2xl font-bold text-white">
                  {(session?.user?.name || "A")[0].toUpperCase()}
                </div>
                <div>
                  <div className="text-white font-semibold">{session?.user?.name}</div>
                  <div className="text-[#888] text-sm">{session?.user?.email}</div>
                  <div className="bg-[rgba(192,57,43,0.15)] text-[#e74c3c] text-[10px] px-2 py-0.5 rounded-full border border-red-700/30 mt-1 inline-block uppercase tracking-widest">
                    {(session?.user as any)?.role || "admin"}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#888] mb-1.5">Display Name</label>
                <div className="flex gap-2">
                  <input value={name} onChange={e => setName(e.target.value)}
                    className="flex-1 bg-white/[0.04] border border-white/[0.07] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-red-700" />
                  <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}
                    className="flex items-center gap-1.5 bg-[#c0392b] hover:bg-[#e74c3c] text-white px-4 py-2 rounded text-sm transition-all disabled:opacity-50">
                    <Save size={12} /> Save
                  </button>
                </div>
              </div>
              <div className="border-t border-white/[0.07] pt-5">
                <div className="font-display text-lg tracking-[2px] text-white mb-4">CHANGE <span className="text-[#e74c3c]">PASSWORD</span></div>
                <form onSubmit={handleChangePw} className="space-y-3">
                  {[
                    { label: "Current Password", value: oldPw, set: setOldPw },
                    { label: "New Password", value: newPw, set: setNewPw },
                    { label: "Confirm New Password", value: confPw, set: setConfPw },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="block text-[10px] uppercase tracking-widest text-[#888] mb-1.5">{f.label}</label>
                      <div className="relative">
                        <input type={showPw ? "text" : "password"} value={f.value} onChange={e => f.set(e.target.value)} required
                          className="w-full bg-white/[0.04] border border-white/[0.07] rounded px-3 py-2 pr-9 text-sm text-white focus:outline-none focus:border-red-700" />
                        {f.label === "Current Password" && (
                          <button type="button" onClick={() => setShowPw(v => !v)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#888]">
                            {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button type="submit" disabled={pwMut.isPending}
                    className="flex items-center gap-1.5 bg-[#c0392b] hover:bg-[#e74c3c] disabled:opacity-50 text-white px-4 py-2 rounded text-sm transition-all">
                    <Save size={12} /> {pwMut.isPending ? "Updating…" : "Update Password"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Danger Zone */}
          {panel === "danger" && (
            <div className="bg-[rgba(15,15,15,0.92)] border border-red-800/30 rounded-lg p-6">
              <div className="font-display text-xl tracking-[2px] text-[#e74c3c] mb-2">DANGER <span className="text-white">ZONE</span></div>
              <p className="text-[#888] text-sm mb-5">These actions are irreversible. Admin eyes only.</p>
              <div className="space-y-4">
                {[
                  { label: "Clear All Transactions", sub: "Delete all transaction history permanently" },
                  { label: "Clear Salary Entries", sub: "Delete all salary and expense records permanently" },
                  { label: "Delete All Accounts", sub: "Remove all GCash account records permanently" },
                  { label: "Full System Reset", sub: "Delete ALL data across the entire system" },
                ].map(b => (
                  <div key={b.label} className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={14} className="text-[#e74c3c] mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm text-white">{b.label}</div>
                        <div className="text-[11px] text-[#888]">{b.sub}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => toast.error("Contact your database admin to perform this operation.")}
                      className="border border-red-700/30 text-[#e74c3c] hover:bg-red-900/20 px-3 py-1.5 rounded text-xs transition-colors flex-shrink-0 ml-4"
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
