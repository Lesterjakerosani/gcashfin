"use client";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Save, LogOut, AlertTriangle, Shield, Database, Palette, User } from "lucide-react";

type Panel = "profile" | "display" | "data" | "danger";

const PANELS: { key: Panel; label: string; icon: any }[] = [
  { key: "profile", label: "Profile", icon: User },
  { key: "display", label: "Display", icon: Palette },
  { key: "data", label: "Data & Backup", icon: Database },
  { key: "danger", label: "Danger Zone", icon: AlertTriangle },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const [panel, setPanel] = useState<Panel>("profile");
  const [name, setName] = useState(session?.user?.name || "");
  const [oldPw, setOldPw] = useState(""); const [newPw, setNewPw] = useState(""); const [confPw, setConfPw] = useState("");

  const saveMut = useMutation({
    mutationFn: async (key: string) => {
      const res = await fetch("/api/settings", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ key, value: name }) });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to save settings");
    },
    onSuccess: () => toast.success("Settings saved."),
    onError: (error: any) => toast.error(error?.message || "Unable to save settings."),
  });

  const pwMut = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Unable to update password.");
      return body;
    },
    onSuccess: () => {
      toast.success("Password updated successfully!");
      setOldPw(""); setNewPw(""); setConfPw("");
    },
    onError: (error: any) => toast.error(error?.message || "Password update failed."),
  });

  function handleChangePw(e: React.FormEvent) {
    e.preventDefault();
    if (!oldPw || !newPw || !confPw) {
      toast.error("Please fill all password fields.");
      return;
    }
    if (newPw !== confPw) {
      toast.error("Passwords do not match.");
      return;
    }
    if (newPw.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    pwMut.mutate({ currentPassword: oldPw, newPassword: newPw, confirmPassword: confPw });
  }

  function exportData() {
    toast.success("Contact your admin to export full database backup.");
  }

  return (
    <div>
      <div className="font-display text-4xl tracking-[4px] text-white mb-1">SYSTEM <span className="text-[#e74c3c]">SETTINGS</span></div>
      <p className="text-[#888] text-sm mb-6">Configure your GCash Fintech management system</p>

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
          {/* Profile */}
          {panel === "profile" && (
            <div className="bg-[rgba(15,15,15,0.92)] border border-white/[0.07] rounded-lg p-6 space-y-5">
              <div className="font-display text-xl tracking-[2px] text-white">PROFILE <span className="text-[#e74c3c]">SETTINGS</span></div>
              <div className="flex items-center gap-4 pb-4 border-b border-white/[0.07]">
                <div className="w-16 h-16 rounded-full bg-[#c0392b] flex items-center justify-center text-2xl font-bold text-white">
                  {(session?.user?.name || "A")[0].toUpperCase()}
                </div>
                <div>
                  <div className="text-white font-semibold">{session?.user?.name}</div>
                  <div className="text-[#888] text-sm">{session?.user?.email}</div>
                  <div className="bg-[rgba(192,57,43,0.15)] text-[#e74c3c] text-[10px] px-2 py-0.5 rounded-full border border-red-700/30 mt-1 inline-block uppercase tracking-widest">{(session?.user as any)?.role || "admin"}</div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#888] mb-1.5">Display Name</label>
                <div className="flex gap-2">
                  <input value={name} onChange={e=>setName(e.target.value)} className="flex-1 bg-white/[0.04] border border-white/[0.07] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-red-700" />
                  <button onClick={() => saveMut.mutate("displayName")} className="flex items-center gap-1.5 bg-[#c0392b] hover:bg-[#e74c3c] text-white px-4 py-2 rounded text-sm transition-all"><Save size={12} /> Save</button>
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
                      <input type="password" value={f.value} onChange={e=>f.set(e.target.value)} required className="w-full bg-white/[0.04] border border-white/[0.07] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-red-700" />
                    </div>
                  ))}
                  <button
                    type="submit"
                    disabled={pwMut.isPending}
                    className="flex items-center gap-1.5 bg-[#c0392b] hover:bg-[#e74c3c] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded text-sm transition-all mt-1"
                  >
                    <Save size={12} />
                    {pwMut.isPending ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Display */}
          {panel === "display" && (
            <div className="bg-[rgba(15,15,15,0.92)] border border-white/[0.07] rounded-lg p-6">
              <div className="font-display text-xl tracking-[2px] text-white mb-5">DISPLAY <span className="text-[#e74c3c]">SETTINGS</span></div>
              {[
                { label: "Dark Theme", sub: "The system uses a dark theme optimized for financial data", enabled: true },
                { label: "Compact Tables", sub: "Show more rows in account and transaction tables", enabled: false },
                { label: "Animated Charts", sub: "Enable smooth animations on analytics charts", enabled: true },
                { label: "Show Archived Accounts", sub: "Include archived accounts in the default view", enabled: false },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
                  <div>
                    <div className="text-sm text-white">{s.label}</div>
                    <div className="text-[11px] text-[#888]">{s.sub}</div>
                  </div>
                  <div className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative flex-shrink-0 ${s.enabled ? "bg-[#c0392b]" : "bg-white/[0.1]"}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${s.enabled ? "left-6" : "left-1"}`} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Data */}
          {panel === "data" && (
            <div className="bg-[rgba(15,15,15,0.92)] border border-white/[0.07] rounded-lg p-6">
              <div className="font-display text-xl tracking-[2px] text-white mb-5">DATA & <span className="text-[#e74c3c]">BACKUP</span></div>
              <div className="space-y-3">
                {[
                  { label: "Export All Data (CSV)", sub: "Download a full CSV export of all transactions", action: exportData, variant: "outline" },
                  { label: "Export Salary Report (CSV)", sub: "Download salary and expense entries", action: exportData, variant: "outline" },
                  { label: "Backup Database", sub: "Contact your server admin for database backup", action: () => toast.success("Contact your database admin for backups."), variant: "outline" },
                ].map(b => (
                  <div key={b.label} className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
                    <div>
                      <div className="text-sm text-white">{b.label}</div>
                      <div className="text-[11px] text-[#888]">{b.sub}</div>
                    </div>
                    <button onClick={b.action} className="border border-white/[0.07] text-[#888] hover:text-white hover:border-white/20 px-3 py-1.5 rounded text-xs transition-colors flex-shrink-0 ml-4">Export</button>
                  </div>
                ))}
              </div>
              <div className="mt-5 p-4 bg-white/[0.02] border border-white/[0.05] rounded-lg">
                <div className="flex items-center gap-2 text-[#888] text-sm mb-2"><Database size={14} /> Database Info</div>
                <div className="text-xs text-[#555] space-y-1">
                  <div>Provider: <span className="text-[#888]">PostgreSQL</span></div>
                  <div>ORM: <span className="text-[#888]">Prisma</span></div>
                  <div>Storage: <span className="text-[#888]">Cloud / Server</span></div>
                </div>
              </div>
            </div>
          )}

          {/* Danger */}
          {panel === "danger" && (
            <div className="bg-[rgba(15,15,15,0.92)] border border-red-800/30 rounded-lg p-6">
              <div className="font-display text-xl tracking-[2px] text-[#e74c3c] mb-2">DANGER <span className="text-white">ZONE</span></div>
              <p className="text-[#888] text-sm mb-5">These actions are irreversible. Proceed with extreme caution.</p>
              <div className="space-y-4">
                {[
                  { label: "Clear All Transactions", sub: "Delete all transaction history permanently", action: () => toast.error("Action disabled — contact admin to perform data operations on the server.") },
                  { label: "Clear Salary Entries", sub: "Delete all salary and expense records permanently", action: () => toast.error("Action disabled — contact admin to perform data operations on the server.") },
                  { label: "Delete All Accounts", sub: "Remove all GCash account records permanently", action: () => toast.error("Action disabled — contact admin to perform data operations on the server.") },
                  { label: "Full System Reset", sub: "Delete ALL data across the entire system", action: () => toast.error("Action disabled — contact admin to perform data operations on the server.") },
                ].map(b => (
                  <div key={b.label} className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={14} className="text-[#e74c3c] mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm text-white">{b.label}</div>
                        <div className="text-[11px] text-[#888]">{b.sub}</div>
                      </div>
                    </div>
                    <button onClick={b.action} className="border border-red-700/30 text-[#e74c3c] hover:bg-red-900/20 px-3 py-1.5 rounded text-xs transition-colors flex-shrink-0 ml-4">Delete</button>
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
