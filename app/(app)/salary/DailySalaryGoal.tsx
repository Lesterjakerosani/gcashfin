"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import { Target, Edit2, Check, X, Trophy, Star, Flame, Calendar } from "lucide-react";
import { fmt, todayStr } from "@/lib/utils";

type Entry = { id: string; date: string; type: string; amount: number; category: string; notes?: string; createdAt: string; };

interface GoalHistoryItem {
  date: string;
  profit: number;
  goal: number;
  achieved: boolean;
}

/* ── Goku SVG character ── */
function GokuSVG({ mode }: { mode: "celebrate" | "encourage" }) {
  return (
    <div className={`relative flex items-center justify-center ${mode === "celebrate" ? "animate-goku-celebrate" : "animate-goku-encourage"}`}>
      {/* Aura glow */}
      <div className={`absolute inset-0 rounded-full blur-2xl opacity-60 ${mode === "celebrate" ? "bg-yellow-400 animate-pulse" : "bg-blue-400 animate-pulse"}`} style={{ transform: "scale(1.6)" }} />
      <svg width="120" height="160" viewBox="0 0 120 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 drop-shadow-2xl">
        {/* Energy aura */}
        {mode === "celebrate" && (
          <>
            <ellipse cx="60" cy="140" rx="40" ry="12" fill="#FCD34D" opacity="0.3" />
            <path d="M30 100 Q20 70 35 50" stroke="#FCD34D" strokeWidth="3" strokeLinecap="round" opacity="0.6" className="animate-pulse" />
            <path d="M90 100 Q100 70 85 50" stroke="#FCD34D" strokeWidth="3" strokeLinecap="round" opacity="0.6" className="animate-pulse" />
            <path d="M20 80 Q10 60 25 45" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
            <path d="M100 80 Q110 60 95 45" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
          </>
        )}
        {/* Body */}
        <rect x="38" y="90" width="44" height="50" rx="8" fill={mode === "celebrate" ? "#F97316" : "#3B82F6"} />
        {/* Belt */}
        <rect x="38" y="112" width="44" height="8" rx="2" fill={mode === "celebrate" ? "#7C2D12" : "#1E3A5F"} />
        {/* Chest symbol */}
        <circle cx="60" cy="103" r="7" fill={mode === "celebrate" ? "#FCD34D" : "#93C5FD"} opacity="0.9" />
        {/* Legs */}
        <rect x="38" y="132" width="19" height="24" rx="5" fill={mode === "celebrate" ? "#EA580C" : "#2563EB"} />
        <rect x="63" y="132" width="19" height="24" rx="5" fill={mode === "celebrate" ? "#EA580C" : "#2563EB"} />
        {/* Boots */}
        <rect x="35" y="148" width="25" height="12" rx="4" fill="#1C1917" />
        <rect x="60" y="148" width="25" height="12" rx="4" fill="#1C1917" />
        {/* Arms */}
        {mode === "celebrate" ? (
          <>
            <rect x="16" y="90" width="22" height="12" rx="6" fill="#F97316" transform="rotate(-40 16 90)" />
            <rect x="82" y="90" width="22" height="12" rx="6" fill="#F97316" transform="rotate(40 82 90)" />
            {/* Fists up */}
            <circle cx="10" cy="72" r="9" fill="#FBBF24" />
            <circle cx="110" cy="72" r="9" fill="#FBBF24" />
          </>
        ) : (
          <>
            <rect x="20" y="92" width="20" height="12" rx="6" fill="#3B82F6" />
            <rect x="80" y="92" width="20" height="12" rx="6" fill="#3B82F6" />
            {/* Hands down */}
            <circle cx="20" cy="108" r="8" fill="#FBBF24" />
            <circle cx="100" cy="108" r="8" fill="#FBBF24" />
          </>
        )}
        {/* Neck */}
        <rect x="52" y="72" width="16" height="20" rx="4" fill="#FBBF24" />
        {/* Head */}
        <ellipse cx="60" cy="60" rx="26" ry="28" fill="#FBBF24" />
        {/* Eyes */}
        {mode === "celebrate" ? (
          <>
            <ellipse cx="50" cy="56" rx="5" ry="6" fill="white" />
            <ellipse cx="70" cy="56" rx="5" ry="6" fill="white" />
            <circle cx="52" cy="57" r="3" fill="#1C1917" />
            <circle cx="72" cy="57" r="3" fill="#1C1917" />
            <circle cx="53" cy="56" r="1" fill="white" />
            <circle cx="73" cy="56" r="1" fill="white" />
          </>
        ) : (
          <>
            <ellipse cx="50" cy="58" rx="5" ry="5" fill="white" />
            <ellipse cx="70" cy="58" rx="5" ry="5" fill="white" />
            <circle cx="51" cy="59" r="3" fill="#1C1917" />
            <circle cx="71" cy="59" r="3" fill="#1C1917" />
          </>
        )}
        {/* Eyebrows */}
        <path d={mode === "celebrate" ? "M44 48 Q50 44 56 47" : "M44 52 Q50 50 56 52"} stroke="#1C1917" strokeWidth="2.5" strokeLinecap="round" />
        <path d={mode === "celebrate" ? "M64 47 Q70 44 76 48" : "M64 52 Q70 50 76 52"} stroke="#1C1917" strokeWidth="2.5" strokeLinecap="round" />
        {/* Mouth */}
        {mode === "celebrate" ? (
          <path d="M50 70 Q60 78 70 70" stroke="#1C1917" strokeWidth="2" strokeLinecap="round" fill="none" />
        ) : (
          <path d="M52 72 Q60 68 68 72" stroke="#1C1917" strokeWidth="2" strokeLinecap="round" fill="none" />
        )}
        {/* Ear */}
        <ellipse cx="34" cy="62" rx="5" ry="7" fill="#FBBF24" />
        <ellipse cx="86" cy="62" rx="5" ry="7" fill="#FBBF24" />
        {/* Spiky hair — Super Saiyan gold or black */}
        {mode === "celebrate" ? (
          <>
            <path d="M34 45 Q28 20 40 15 Q42 35 48 38" fill="#FCD34D" />
            <path d="M42 38 Q38 10 52 5 Q52 30 58 35" fill="#FDE68A" />
            <path d="M55 35 Q55 5 68 8 Q62 28 65 35" fill="#FCD34D" />
            <path d="M63 36 Q72 12 80 18 Q70 32 72 38" fill="#F59E0B" />
            <path d="M70 40 Q82 22 86 30 Q76 38 76 44" fill="#FCD34D" />
          </>
        ) : (
          <>
            <path d="M34 45 Q28 20 40 15 Q42 35 48 38" fill="#1C1917" />
            <path d="M42 38 Q38 10 52 5 Q52 30 58 35" fill="#292524" />
            <path d="M55 35 Q55 5 68 8 Q62 28 65 35" fill="#1C1917" />
            <path d="M63 36 Q72 12 80 18 Q70 32 72 38" fill="#292524" />
            <path d="M70 40 Q82 22 86 30 Q76 38 76 44" fill="#1C1917" />
          </>
        )}
        {/* Tail */}
        <path d="M78 130 Q95 120 98 108 Q100 95 90 92" stroke={mode === "celebrate" ? "#92400E" : "#1E3A5F"} strokeWidth="6" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
}

/* ── Confetti burst ── */
function fireConfetti() {
  const count = 200;
  const defaults = { origin: { y: 0.7 } };
  function fire(ratio: number, opts: confetti.Options) {
    confetti({ ...defaults, ...opts, particleCount: Math.floor(count * ratio) });
  }
  fire(0.25, { spread: 26, startVelocity: 55, colors: ["#FCD34D", "#F97316", "#EF4444"] });
  fire(0.2,  { spread: 60, colors: ["#10B981", "#3B82F6", "#8B5CF6"] });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ["#FCD34D", "#FDE68A"] });
  fire(0.1,  { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1,  { spread: 120, startVelocity: 45 });
}

/* ── Star particles ── */
function StarParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="absolute animate-float-star"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${i * 0.3}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        >
          <Star size={10 + Math.floor(Math.random() * 12)} className="text-yellow-400" fill="currentColor" />
        </div>
      ))}
    </div>
  );
}

/* ── Main component ── */
export default function DailySalaryGoal({ entries }: { entries: Entry[] }) {
  const qc = useQueryClient();
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const confettiFired = useRef(false);

  const { data: settings = {} } = useQuery<Record<string, string>>({
    queryKey: ["settings"],
    queryFn: () => fetch("/api/settings").then(r => r.json()),
  });

  const { data: allEntries = [] } = useQuery<Entry[]>({
    queryKey: ["salary", "all"],
    queryFn: () => fetch("/api/salary?all=true").then(r => r.json()),
  });

  const saveSetting = useMutation({
    mutationFn: (data: { key: string; value: string }) =>
      fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings"] }); setEditingGoal(false); },
  });

  const goal = parseFloat(settings["dailySalaryGoal"] || "0");
  const today = todayStr();

  const todayProfit = entries
    .filter(e => e.type !== "expense" && e.date === today)
    .reduce((s, e) => s + e.amount, 0);

  const pct = goal > 0 ? Math.min(100, (todayProfit / goal) * 100) : 0;
  const achieved = goal > 0 && todayProfit >= goal;
  const hasGoal = goal > 0;

  // Fire confetti once when achieved
  useEffect(() => {
    if (achieved && !confettiFired.current) {
      confettiFired.current = true;
      setTimeout(fireConfetti, 400);
      setTimeout(fireConfetti, 1200);
    }
    if (!achieved) confettiFired.current = false;
  }, [achieved]);

  // Build goal history from allEntries (last 14 days, skip today)
  const goalHistory: GoalHistoryItem[] = [];
  if (goal > 0) {
    for (let i = 1; i <= 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
      const dayProfit = allEntries.filter(e => e.type !== "expense" && e.date === ds).reduce((s, e) => s + e.amount, 0);
      goalHistory.push({ date: ds, profit: dayProfit, goal, achieved: dayProfit >= goal });
    }
  }
  const historyAchieved = goalHistory.filter(h => h.achieved).length;

  function saveGoal() {
    const v = parseFloat(goalInput);
    if (!v || v <= 0) return;
    saveSetting.mutate({ key: "dailySalaryGoal", value: String(v) });
  }

  return (
    <div className="space-y-4">
      {/* Goal Card */}
      <div className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-500 ${
        achieved
          ? "border-yellow-400 bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50 dark:from-yellow-900/20 dark:via-orange-900/20 dark:to-amber-900/20 shadow-lg shadow-yellow-200/50 dark:shadow-yellow-900/30"
          : hasGoal
          ? "border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10"
          : "border-gray-200 dark:border-[#3E4042] bg-white dark:bg-[#242526]"
      }`}>

        {achieved && <StarParticles />}

        {/* Shimmer effect when achieved */}
        {achieved && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-200/30 to-transparent animate-shimmer pointer-events-none" />
        )}

        <div className="relative z-10 p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${achieved ? "bg-yellow-400 shadow-lg shadow-yellow-300/50" : "bg-blue-100 dark:bg-blue-900/30"}`}>
                <Target size={18} className={achieved ? "text-white" : "text-blue-600 dark:text-blue-400"} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-[#E4E6EB]">Daily Salary Goal</h3>
                <p className="text-[10px] text-gray-400 dark:text-[#B0B3B8]">Today's challenge</p>
              </div>
            </div>
            {!editingGoal ? (
              <button onClick={() => { setGoalInput(goal > 0 ? String(goal) : ""); setEditingGoal(true); }}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20">
                <Edit2 size={12} /> {goal > 0 ? "Edit" : "Set Goal"}
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={goalInput}
                  onChange={e => setGoalInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") saveGoal(); if (e.key === "Escape") setEditingGoal(false); }}
                  placeholder="e.g. 2000"
                  autoFocus
                  className="w-28 bg-white dark:bg-[#3A3B3C] border border-blue-300 dark:border-blue-600 rounded-lg px-2 py-1 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button onClick={saveGoal} className="w-7 h-7 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg flex items-center justify-center transition-colors">
                  <Check size={12} />
                </button>
                <button onClick={() => setEditingGoal(false)} className="w-7 h-7 bg-gray-100 dark:bg-[#3A3B3C] hover:bg-gray-200 text-gray-500 rounded-lg flex items-center justify-center transition-colors">
                  <X size={12} />
                </button>
              </div>
            )}
          </div>

          {!hasGoal ? (
            <div className="text-center py-6">
              <div className="text-3xl mb-2">🎯</div>
              <p className="text-sm text-gray-500 dark:text-[#B0B3B8]">Set a daily goal to start tracking your progress!</p>
            </div>
          ) : (
            <>
              {/* Progress row */}
              <div className="flex items-end justify-between mb-2">
                <div>
                  <span className="text-3xl font-bold text-gray-900 dark:text-[#E4E6EB]">₱{fmt(todayProfit)}</span>
                  <span className="text-sm text-gray-400 dark:text-[#B0B3B8] ml-1">/ ₱{fmt(goal)}</span>
                </div>
                <span className={`text-lg font-bold ${achieved ? "text-yellow-500" : pct >= 75 ? "text-emerald-500" : pct >= 50 ? "text-blue-500" : "text-gray-400"}`}>
                  {pct.toFixed(0)}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-4 bg-gray-100 dark:bg-[#3A3B3C] rounded-full overflow-hidden mb-4 shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden ${
                    achieved
                      ? "bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400"
                      : pct >= 75
                      ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                      : pct >= 50
                      ? "bg-gradient-to-r from-blue-400 to-blue-500"
                      : "bg-gradient-to-r from-indigo-400 to-blue-400"
                  }`}
                  style={{ width: `${pct}%` }}
                >
                  {/* Shimmer inside bar */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </div>
              </div>

              {/* Goku + Message */}
              {achieved ? (
                <div className="flex items-center gap-4 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-2xl p-4 border border-yellow-300 dark:border-yellow-700">
                  <div className="flex-shrink-0">
                    <GokuSVG mode="celebrate" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Trophy size={16} className="text-yellow-500" />
                      <span className="text-sm font-bold text-yellow-700 dark:text-yellow-400">Goal Achieved!</span>
                      <span className="text-lg">🏆</span>
                    </div>
                    <p className="text-xs font-medium text-orange-800 dark:text-orange-300 leading-relaxed">
                      Congratulations! You achieved your daily salary goal! Keep pushing beyond your limits!
                    </p>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {["💪 Power Level: MAX", "⚡ Super Saiyan Mode", "🌟 Goal Crusher"].map(badge => (
                        <span key={badge} className="text-[10px] bg-yellow-200 dark:bg-yellow-800/50 text-yellow-800 dark:text-yellow-300 px-2 py-0.5 rounded-full font-medium">{badge}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-4 border border-blue-200 dark:border-blue-800">
                  <div className="flex-shrink-0">
                    <GokuSVG mode="encourage" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Flame size={16} className="text-blue-500" />
                      <span className="text-sm font-bold text-blue-700 dark:text-blue-400">Keep Fighting!</span>
                    </div>
                    <p className="text-xs font-medium text-blue-800 dark:text-blue-300 leading-relaxed">
                      {pct >= 75
                        ? "Almost there! You're so close — give it everything you've got!"
                        : pct >= 50
                        ? "More than halfway! Your power is growing — don't stop now!"
                        : pct > 0
                        ? "Good luck next time! You can do it! Never give up!"
                        : "Your journey begins now! Set your power level and surpass your limits!"}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] text-blue-500 dark:text-blue-400 font-mono">₱{fmt(Math.max(0, goal - todayProfit))} remaining</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Goal History */}
      {hasGoal && goalHistory.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-[#3E4042] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={15} className="text-gray-400 dark:text-[#B0B3B8]" />
              <h3 className="section-title">Goal History</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                {historyAchieved}/{goalHistory.length} achieved
              </span>
            </div>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-[#3E4042]/50 max-h-64 overflow-y-auto">
            {goalHistory.map(item => {
              const itemPct = Math.min(100, (item.profit / item.goal) * 100);
              const d = new Date(item.date + "T00:00:00");
              const label = d.toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric" });
              return (
                <div key={item.date} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-[#3A3B3C]/20 transition-colors">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${item.achieved ? "bg-yellow-100 dark:bg-yellow-900/30" : "bg-gray-100 dark:bg-[#3A3B3C]"}`}>
                    {item.achieved ? <Trophy size={14} className="text-yellow-500" /> : <Target size={14} className="text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700 dark:text-[#E4E6EB]">{label}</span>
                      <span className={`text-xs font-mono ${item.achieved ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                        ₱{fmt(item.profit)} / ₱{fmt(item.goal)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-[#3A3B3C] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.achieved ? "bg-gradient-to-r from-yellow-400 to-orange-400" : "bg-gradient-to-r from-blue-400 to-indigo-400"}`}
                        style={{ width: `${itemPct}%` }}
                      />
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold flex-shrink-0 ${item.achieved ? "text-yellow-500" : "text-gray-400"}`}>
                    {itemPct.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
