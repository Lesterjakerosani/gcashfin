"use client";
import { useState } from "react";
import { X, Smartphone, Download } from "lucide-react";

export function AppDownloadBanner() {
  const [visible, setVisible] = useState(true);

  function dismiss() {
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="relative z-50 w-full bg-gradient-to-r from-[#0078FF] to-[#00A3FF] text-white px-4 py-2.5 flex items-center justify-between gap-3 shadow-md">
      <div className="flex items-center gap-3 min-w-0">
        <Smartphone className="shrink-0 w-5 h-5 opacity-90" />
        <p className="text-sm font-medium leading-tight truncate">
          Get the best experience — download the{" "}
          <span className="font-bold">GCashFin app</span> for Android.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <a
          href="/app/gcashfin.apk"
          download
          className="flex items-center gap-1.5 bg-white text-[#0078FF] text-xs font-bold px-3 py-1.5 rounded-full hover:bg-blue-50 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Download APK
        </a>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="p-1 rounded-full hover:bg-white/20 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
