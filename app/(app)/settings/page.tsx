"use client";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Save, LogOut, AlertTriangle, User, Eye, EyeOff } from "lucide-react";

type Panel = "profile" | "danger";

const PANELS: { key: Panel; label: string; icon: any }[] = [
  { key: "profile", label: "My Profile", icon: User },
  { key: "danger", label: "Danger Zone", icon: AlertTriangle },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const [panel, setPanel] = useState<Panel>("profile");

  const [name, setName] = useState(session?.user?.name || "");
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confPw, setConfPw] = useState("");
  const [showPw, setShowPw] = useState(false);

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

  function handleChangePw(e: React.FormEvent) {
    e.preventDefault();
    if (!oldPw || !newPw || !confPw) { toast.error("Fill all fields."); return; }
    if (newPw !== confPw) { toast.error("Passwords do not match."); return; }
    if (newPw.length < 6) { toast.error("Minimum 6 characters."); return; }
    pwMut.mutate();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-5">
        {/* Sidebar Nav */}
        <div className="card p-2 h-fit">
          {PANELS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setPanel(key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 ${
                panel === key
                  ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm"
                  : "text-gray-600 dark:text-[#E4E6EB] hover:bg-gray-100 dark:hover:bg-[#3A3B3C] hover:text-gray-900 dark:hover:text-[#E4E6EB]"
              }`}>
              <Icon size={15} /> {label}
            </button>
          ))}
          <div className="border-t border-gray-100 dark:border-[#3E4042] mt-2 pt-2">
            <button onClick={() => signOut({ callbackUrl: "/auth/login" })}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-500 dark:text-[#B0B3B8] hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] transition-colors">
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </div>

        <div>
          {/* My Profile */}
          {panel === "profile" && (
            <div className="card p-6 space-y-5">
              <h2 className="section-title">My Profile</h2>
              <div className="flex items-center gap-4 pb-4 border-b border-gray-100 dark:border-[#3E4042]">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
                  {(session?.user?.name || "U")[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-[#E4E6EB]">{session?.user?.name}</div>
                  <div className="text-sm text-gray-500 dark:text-[#B0B3B8]">{session?.user?.email}</div>
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

              <div className="border-t border-gray-100 dark:border-[#3E4042] pt-5">
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
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#B0B3B8] hover:text-gray-600 dark:hover:text-slate-300 transition-colors">
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
              <p className="text-sm text-gray-500 dark:text-[#B0B3B8] mb-5">These actions are irreversible.</p>
              <div className="space-y-3">
                {[
                  { label: "Clear All Transactions", sub: "Delete all transaction history permanently" },
                  { label: "Clear Salary Entries", sub: "Delete all salary and expense records permanently" },
                  { label: "Delete All Accounts", sub: "Remove all GCash account records permanently" },
                  { label: "Full System Reset", sub: "Delete ALL data across the entire system" },
                ].map(b => (
                  <div key={b.label} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-[#3E4042]/50 last:border-0">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-gray-800 dark:text-[#E4E6EB]">{b.label}</div>
                        <div className="text-xs text-gray-500 dark:text-[#B0B3B8]">{b.sub}</div>
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
