"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { AlertCircle, AlertTriangle, ShieldQuestion } from "lucide-react";
import { SECURITY_QUESTIONS, getRandomQuestion } from "@/lib/security-questions";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSecurityQuestion(getRandomQuestion());
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (!securityAnswer.trim()) { setError("Please answer the security question."); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, securityQuestion, securityAnswer }),
    });
    let data: any = null;
    try { data = await res.json(); } catch { data = null; }
    setLoading(false);
    if (!res.ok) {
      setError(data?.error || data?.message || "Registration failed.");
    } else {
      toast.success("Account created! Please sign in.");
      router.push("/auth/login");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#18191A] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/favicon.ico" alt="GCashFin" className="w-14 h-14 rounded-2xl shadow-lg mb-4 object-contain mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-[#E4E6EB] tracking-tight">GCashFin</h1>
          <p className="text-sm text-gray-500 dark:text-[#B0B3B8] mt-1">Financial Management System</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-[#E4E6EB] mb-1">Create account</h2>
          <p className="text-sm text-gray-500 dark:text-[#B0B3B8] mb-6">Set up your financial management system</p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl mb-5">
              <AlertCircle size={15} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} required placeholder="Your Name" className="input-field" />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" className="input-field" />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min. 6 characters" className="input-field" />
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="Repeat password" className="input-field" />
            </div>

            {/* Security Question */}
            <div className="pt-2 border-t border-gray-100 dark:border-[#3E4042]">
              <div className="flex items-center gap-2 mb-3">
                <ShieldQuestion size={16} className="text-blue-500" />
                <span className="text-sm font-semibold text-gray-700 dark:text-[#E4E6EB]">Security Question</span>
              </div>
              <div className="mb-3">
                <label className="label">Your Security Question</label>
                <div className="input-field bg-gray-50 dark:bg-[#3A3B3C] text-gray-700 dark:text-[#E4E6EB] cursor-default select-none">
                  {securityQuestion}
                </div>
                <p className="text-[11px] text-gray-400 dark:text-[#B0B3B8] mt-1">This question was randomly assigned for your account security.</p>
              </div>
              <div>
                <label className="label">Your Answer</label>
                <input
                  value={securityAnswer}
                  onChange={e => setSecurityAnswer(e.target.value)}
                  required
                  placeholder="Type your answer..."
                  className="input-field"
                  autoComplete="off"
                />
              </div>
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

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating Account…</>
              ) : "Create Account"}
            </button>
          </form>

          <p className="text-center text-gray-400 dark:text-[#B0B3B8] text-sm mt-6">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-gray-900 dark:text-[#E4E6EB] font-medium hover:underline transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
