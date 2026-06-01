"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Save, Shield, Globe, Palette } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminSettingsPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    siteName: "", siteDescription: "", contactEmail: "",
    maintenanceMode: "false", primaryColor: "#10B981", allowRegistration: "true",
  });

  const { data: settings } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => fetch("/api/admin/settings").then(r => r.json()),
  });

  useEffect(() => { if (settings) setForm(f => ({ ...f, ...settings })); }, [settings]);

  const saveMut = useMutation({
    mutationFn: (data: any) => fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-settings"] }); toast.success("Settings saved!"); },
    onError: () => toast.error("Failed to save settings."),
  });

  function handleSubmit(e: React.FormEvent) { e.preventDefault(); saveMut.mutate(form); }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="page-title flex items-center gap-2"><Settings size={20} className="text-red-500" />System Settings</h1>
        <p className="page-subtitle">Configure application-wide settings and preferences</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Globe size={16} className="text-blue-500" />
            <h2 className="section-title">General Information</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label">Site Name</label>
              <input value={form.siteName} onChange={e => setForm(f => ({ ...f, siteName: e.target.value }))} placeholder="GCashFin" className="input-field" />
            </div>
            <div>
              <label className="label">Site Description</label>
              <input value={form.siteDescription} onChange={e => setForm(f => ({ ...f, siteDescription: e.target.value }))} placeholder="Real-time GCash account monitoring" className="input-field" />
            </div>
            <div>
              <label className="label">Contact Email</label>
              <input type="email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} placeholder="admin@gmail.com" className="input-field" />
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Shield size={16} className="text-red-500" />
            <h2 className="section-title">Security & Access</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#3A3B3C] rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-[#E4E6EB]">Allow User Registration</p>
                <p className="text-xs text-gray-400 dark:text-[#B0B3B8] mt-0.5">Allow new users to register accounts</p>
              </div>
              <button type="button" onClick={() => setForm(f => ({ ...f, allowRegistration: f.allowRegistration === "true" ? "false" : "true" }))}
                className={`w-12 h-6 rounded-full transition-all relative ${form.allowRegistration === "true" ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.allowRegistration === "true" ? "left-6" : "left-0.5"}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#3A3B3C] rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-[#E4E6EB]">Maintenance Mode</p>
                <p className="text-xs text-gray-400 dark:text-[#B0B3B8] mt-0.5">Temporarily disable user access</p>
              </div>
              <button type="button" onClick={() => setForm(f => ({ ...f, maintenanceMode: f.maintenanceMode === "true" ? "false" : "true" }))}
                className={`w-12 h-6 rounded-full transition-all relative ${form.maintenanceMode === "true" ? "bg-red-500" : "bg-gray-300 dark:bg-gray-600"}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.maintenanceMode === "true" ? "left-6" : "left-0.5"}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Palette size={16} className="text-purple-500" />
            <h2 className="section-title">Branding</h2>
          </div>
          <div>
            <label className="label">Primary Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={form.primaryColor} onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))}
                className="w-12 h-10 rounded-lg border border-gray-200 dark:border-[#3E4042] cursor-pointer" />
              <input value={form.primaryColor} onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))}
                placeholder="#10B981" className="input-field font-mono" />
              <div className="w-10 h-10 rounded-xl flex-shrink-0 border border-gray-200 dark:border-[#3E4042]" style={{ background: form.primaryColor }} />
            </div>
          </div>
        </div>

        <button type="submit" disabled={saveMut.isPending} className="btn-primary gap-2">
          <Save size={15} />{saveMut.isPending ? "Saving…" : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
