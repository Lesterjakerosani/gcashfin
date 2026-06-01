"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AlertCircle, ArrowLeft, CheckCircle, KeyRound, ShieldQuestion, Lock } from "lucide-react";

type Step = "email" | "answer" | "reset" | "done";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [userId, setUserId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* Step 1 — find account + get question */
  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch(`/api/auth/forgot-password?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { setError(data?.error || "Account not found."); return; }
    setQuestion(data.question);
    setStep("answer");
  }

  /* Step 2 — verify security answer */
  async function handleAnswerSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!answer.trim()) { setError("Please provide your answer."); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/auth/forgot-password/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase(), answer }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { setError(data?.error || "Incorrect answer."); return; }
    setResetToken(data.resetToken);
    setUserId(data.userId);
    setStep("reset");
  }

  /* Step 3 — set new password */
  async function handleResetSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/auth/forgot-password/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, resetToken, newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { setError(data?.error || "Failed to reset password."); return; }
    toast.success("Password reset successfully!");
    setStep("done");
  }

  const stepLabels = ["Find Account", "Verify Identity", "New Password"];
  const stepIndex = step === "email" ? 0 : step === "answer" ? 1 : step === "reset" ? 2 : 3;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#18191A] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/favicon.ico" alt="GCashFin" className="w-14 h-14 rounded-2xl shadow-lg mb-4 object-contain mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-[#E4E6EB] tracking-tight">GCashFin</h1>
          <p className="text-sm text-gray-500 dark:text-[#B0B3B8] mt-1">Password Recovery</p>
        </div>

        <div className="card p-8">
          {/* Step indicator */}
          {step !== "done" && (
            <div className="flex items-center gap-2 mb-6">
              {stepLabels.map((label, i) => (
                <div key={label} className="flex items-center gap-2 flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                    i < stepIndex ? "bg-emerald-500 text-white" : i === stepIndex ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-[#3E4042] text-gray-400"
                  }`}>
                    {i < stepIndex ? <CheckCircle size={14} /> : i + 1}
                  </div>
                  <span className={`text-[10px] font-medium hidden sm:block ${i === stepIndex ? "text-blue-500" : "text-gray-400 dark:text-[#B0B3B8]"}`}>{label}</span>
                  {i < stepLabels.length - 1 && <div className={`flex-1 h-px ${i < stepIndex ? "bg-emerald-400" : "bg-gray-200 dark:bg-[#3E4042]"}`} />}
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl mb-5">
              <AlertCircle size={15} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Step 1 — Email */}
          {step === "email" && (
            <>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <KeyRound size={18} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-[#E4E6EB]">Forgot Password</h2>
                  <p className="text-xs text-gray-500 dark:text-[#B0B3B8]">Enter your account email</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-[#B0B3B8] mb-6 leading-relaxed">
                We'll retrieve your security question to verify your identity.
              </p>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="label">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="input-field"
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                  {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Finding Account…</> : "Find My Account"}
                </button>
              </form>
            </>
          )}

          {/* Step 2 — Security Answer */}
          {step === "answer" && (
            <>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <ShieldQuestion size={18} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-[#E4E6EB]">Verify Identity</h2>
                  <p className="text-xs text-gray-500 dark:text-[#B0B3B8]">Answer your security question</p>
                </div>
              </div>
              <form onSubmit={handleAnswerSubmit} className="space-y-4 mt-6">
                <div>
                  <label className="label">Security Question</label>
                  <div className="input-field bg-gray-50 dark:bg-[#3A3B3C] text-gray-700 dark:text-[#E4E6EB] cursor-default select-none font-medium">
                    {question}
                  </div>
                </div>
                <div>
                  <label className="label">Your Answer</label>
                  <input
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    required
                    placeholder="Type your answer..."
                    className="input-field"
                    autoComplete="off"
                  />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setStep("email"); setError(""); }} className="btn-secondary flex items-center gap-1.5">
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button type="submit" disabled={loading} className="btn-primary flex-1 py-3">
                    {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Verifying…</> : "Verify Answer"}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Step 3 — Reset Password */}
          {step === "reset" && (
            <>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                  <Lock size={18} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-[#E4E6EB]">Set New Password</h2>
                  <p className="text-xs text-gray-500 dark:text-[#B0B3B8]">Identity verified — choose a new password</p>
                </div>
              </div>
              <form onSubmit={handleResetSubmit} className="space-y-4 mt-6">
                <div>
                  <label className="label">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    placeholder="Min. 6 characters"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Repeat new password"
                    className="input-field"
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                  {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Resetting…</> : "Reset Password"}
                </button>
              </form>
            </>
          )}

          {/* Done */}
          {step === "done" && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-[#E4E6EB] mb-2">Password Reset!</h2>
              <p className="text-sm text-gray-500 dark:text-[#B0B3B8] mb-6">Your password has been updated successfully. You can now sign in with your new password.</p>
              <button onClick={() => router.push("/auth/login")} className="btn-primary w-full py-3">
                Go to Sign In
              </button>
            </div>
          )}

          {step !== "done" && (
            <p className="text-center text-gray-400 dark:text-[#B0B3B8] text-sm mt-6">
              Remember your password?{" "}
              <Link href="/auth/login" className="text-gray-900 dark:text-[#E4E6EB] font-medium hover:underline transition-colors">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
