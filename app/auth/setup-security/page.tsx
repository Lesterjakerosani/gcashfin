"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AlertCircle, AlertTriangle, ShieldQuestion, Shield } from "lucide-react";
import { getRandomQuestion } from "@/lib/security-questions";

export default function SetupSecurityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth/login");
  }, [status, router]);

  useEffect(() => {
    setSecurityQuestion(getRandomQuestion());
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!securityAnswer.trim()) { setError("Please provide an answer."); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/auth/setup-security", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ securityQuestion, securityAnswer }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data?.error || "Failed to save security question.");
    } else {
      toast.success("Security question saved! Welcome.");
      router.replace("/dashboard");
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#18191A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#18191A] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/favicon.ico" alt="GCashFin" className="w-14 h-14 rounded-2xl shadow-lg mb-4 object-contain mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-[#E4E6EB] tracking-tight">GCashFin</h1>
        </div>

        <div className="card p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-[#E4E6EB]">Security Question Required</h2>
              <p className="text-xs text-gray-500 dark:text-[#B0B3B8]">One-time setup before you continue</p>
            </div>
          </div>

          <p className="text-sm text-gray-500 dark:text-[#B0B3B8] mb-6 leading-relaxed">
            Before continuing, please set up your security question for password recovery.
          </p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl mb-5">
              <AlertCircle size={15} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShieldQuestion size={14} className="text-blue-500" />
                <label className="label !mb-0">Question</label>
              </div>
              <div className="input-field bg-gray-50 dark:bg-[#3A3B3C] text-gray-700 dark:text-[#E4E6EB] cursor-default select-none">
                {securityQuestion}
              </div>
              <p className="text-[11px] text-gray-400 dark:text-[#B0B3B8] mt-1">Randomly assigned for your account security.</p>
            </div>

            <div>
              <label className="label">Answer</label>
              <input
                value={securityAnswer}
                onChange={e => setSecurityAnswer(e.target.value)}
                required
                placeholder="Type your answer..."
                className="input-field"
                autoComplete="off"
              />
            </div>

            {/* Warning Box */}
            <div className="rounded-xl border-2 border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-1">⚠️ IMPORTANT</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                    Remember your security answer. If you forget your password in the future, you will be asked the same security question to recover your account.
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed mt-1.5">
                    If you forget your security answer, you may lose access to your account and will need administrator assistance to recover it.
                  </p>
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
              ) : "Save & Continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
