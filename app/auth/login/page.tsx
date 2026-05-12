"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

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
    if (res?.error) { setError("Invalid email or password."); }
    else { toast.success("Welcome back!"); router.push("/dashboard"); router.refresh(); }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1920&q=80')] bg-cover bg-center opacity-[0.06]" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[rgba(40,10,10,0.95)] to-[#0a0a0a]" />
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="text-center mb-8">
          <div className="font-display text-5xl tracking-[6px] text-[#e74c3c] mb-1">GCASH<span className="text-white">FIN</span></div>
          <p className="text-[#888] text-sm tracking-widest uppercase">Financial Management System</p>
        </div>
        <div className="bg-[rgba(15,15,15,0.95)] border border-white/[0.07] rounded-xl p-8 backdrop-blur">
          <h1 className="font-display text-2xl tracking-[3px] text-white mb-2">SIGN <span className="text-[#e74c3c]">IN</span></h1>
          <p className="text-[#888] text-xs mb-6">Access your financial dashboard</p>
          {error && <div className="bg-red-900/20 border border-red-700/30 text-red-400 text-sm px-4 py-3 rounded mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#888] font-semibold mb-1.5">Email Address</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="admin@gcashfin.com"
                className="w-full bg-white/[0.04] border border-white/[0.07] rounded px-3 py-2.5 text-sm text-white placeholder-[#555] focus:outline-none focus:border-red-700 transition-colors" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#888] font-semibold mb-1.5">Password</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••"
                className="w-full bg-white/[0.04] border border-white/[0.07] rounded px-3 py-2.5 text-sm text-white placeholder-[#555] focus:outline-none focus:border-red-700 transition-colors" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-[#c0392b] hover:bg-[#e74c3c] text-white font-semibold py-3 rounded text-sm tracking-wider uppercase transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2">
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
          <p className="text-center text-[#555] text-xs mt-6">
            No account?{" "}
            <Link href="/auth/register" className="text-[#e74c3c] hover:text-red-400 transition-colors">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
