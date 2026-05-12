"use client";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30000, refetchOnWindowFocus: false } },
  }));
  return (
    <SessionProvider>
      <QueryClientProvider client={qc}>
        {children}
        <Toaster position="bottom-right" toastOptions={{
          style: { background: "#111", color: "#f0f0f0", border: "1px solid rgba(255,255,255,0.07)", borderLeft: "3px solid #c0392b" },
          success: { style: { borderLeft: "3px solid #27ae60" } },
          error: { style: { borderLeft: "3px solid #e74c3c" } },
        }} />
      </QueryClientProvider>
    </SessionProvider>
  );
}
