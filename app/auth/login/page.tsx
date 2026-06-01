"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { AlertCircle, KeyRound } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) { setError("Invalid email or password."); return; }
    // Fetch session to determine role-based redirect
    const sessionRes = await fetch("/api/auth/session");
    const session = await sessionRes.json();
    const role = session?.user?.role;
    toast.success("Welcome back!");
    if (role === "admin") { router.push("/admin/dashboard"); }
    else { router.push("/dashboard"); }
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#18191A] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/favicon.ico" alt="GCashFin" className="w-14 h-14 rounded-2xl shadow-lg mb-4 object-contain mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-[#E4E6EB] tracking-tight">GCashFin</h1>
          <p className="text-sm text-gray-500 dark:text-[#B0B3B8] mt-1">Financial Management System</p>
        </div>

        {/* Creator */}
        <div className="flex flex-col items-center mb-6 gap-2">
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-emerald-300 to-emerald-400 dark:via-emerald-700 dark:to-emerald-600" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-500 dark:text-emerald-400">Creator</span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-emerald-300 to-emerald-400 dark:via-emerald-700 dark:to-emerald-600" />
          </div>
          <div className="relative inline-flex flex-col items-center px-6 py-3 rounded-2xl border border-emerald-200/70 dark:border-emerald-800/50 bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-900/20 dark:to-transparent shadow-sm">
            <span className="text-[11px] tracking-widest text-gray-400 dark:text-[#B0B3B8] uppercase mb-0.5">This website was created by</span>
            <span className="text-4xl font-black tracking-tight bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 bg-clip-text text-transparent drop-shadow-sm">
              CHAO
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="card p-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-[#E4E6EB] mb-1">Sign in</h2>
          <p className="text-sm text-gray-500 dark:text-[#B0B3B8] mb-6">Access your financial dashboard</p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl mb-5">
              <AlertCircle size={15} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="admin@gcashfin.com"
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="input-field"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : "Sign In"}
            </button>
          </form>

          <div className="flex items-center justify-between mt-5">
            <p className="text-gray-400 dark:text-[#B0B3B8] text-sm">
              No account?{" "}
              <Link href="/auth/register" className="text-gray-900 dark:text-[#E4E6EB] font-medium hover:underline transition-colors">
                Create one
              </Link>
            </p>
            <Link href="/auth/forgot-password" className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
              <KeyRound size={12} />
              Forgot password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
