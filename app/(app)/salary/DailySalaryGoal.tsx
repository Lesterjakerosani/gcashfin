"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import { Target, Edit2, Check, X, Trophy, Star, Flame } from "lucide-react";
import { fmt, todayStr } from "@/lib/utils";

type Entry = { id: string; date: string; type: string; amount: number; category: string; notes?: string; createdAt: string; };

interface GoalHistoryItem {
  date: string;
  profit: number;
  goal: number;
  achieved: boolean;
}

/* ── Famous anime male characters (Giphy stickers — transparent background) ── */
function CharacterGif({ mode, size = "w-52 h-52" }: { mode: "celebrate" | "encourage" | "sad"; size?: string }) {
  const stickerId = mode === "celebrate"
    ? "d5WPPDrT5eDs0CaGPA"   // Luffy big happy smile (Netflix official)
    : mode === "sad"
    ? "Pbk40kdlhTy7o2Flz7"   // Sasuke sad
    : "J6VWOd9svfh5KESnP9";  // Naruto energetic
  const label = mode === "celebrate" ? "Luffy celebrating" : mode === "sad" ? "Sasuke sad" : "Naruto encouraging";
  return (
    <div className={`flex items-center justify-center ${mode === "celebrate" ? "animate-goku-celebrate" : "animate-goku-encourage"}`}>
      <img
        src={`https://media.giphy.com/media/${stickerId}/giphy.webp`}
        alt={label}
        className={`${size} object-contain`}
      />
    </div>
  );
}

/* ── Midnight result popup ── */
function MidnightPopup({ result, onClose }: { result: "achieved" | "missed"; onClose: () => void }) {
  useEffect(() => {
    if (result === "achieved") {
      setTimeout(fireConfetti, 300);
      setTimeout(fireConfetti, 1100);
    }
  }, [result]);

  const achieved = result === "achieved";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className={`relative rounded-3xl border-2 shadow-2xl w-full max-w-sm overflow-hidden ${
        achieved
          ? "bg-gradient-to-b from-yellow-50 to-orange-50 dark:from-yellow-900/40 dark:to-orange-900/40 border-yellow-400"
          : "bg-gradient-to-b from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black border-slate-600"
      }`}>
        {/* Close button */}
        <button onClick={onClose} className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center transition-colors">
          <X size={14} className="text-white" />
        </button>

        <div className="flex flex-col items-center px-6 pt-8 pb-6">
          {/* Speech bubble cloud above character */}
          <div className="relative mb-2 w-full">
            <div className={`rounded-2xl px-5 py-4 text-center border-2 shadow-lg ${
              achieved
                ? "bg-yellow-400 border-yellow-500 text-yellow-900"
                : "bg-white border-gray-200 text-gray-800"
            }`}>
              <p className="text-base font-bold leading-snug">
                {achieved
                  ? "🏆 Congratulations! You crushed your daily goal! Amazing work — keep it up!"
                  : "It's okay, better luck next time! Never give up, every day is a new chance! 💪"}
              </p>
              {/* Bubble tail pointing down */}
              <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[14px] ${
                achieved ? "border-t-yellow-400" : "border-t-white"
              }`} />
            </div>
          </div>

          {/* Sasuke character — both states use Sasuke */}
          <div className={`flex items-center justify-center ${achieved ? "animate-goku-celebrate" : "animate-goku-encourage"}`}>
            <img
              src={`https://media.giphy.com/media/Pbk40kdlhTy7o2Flz7/giphy.webp`}
              alt="Sasuke"
              className="w-64 h-64 object-contain"
            />
          </div>

          {achieved && (
            <div className="flex gap-2 flex-wrap justify-center mt-2">
              {["🌟 Goal Crusher", "⚡ Legendary", "💪 Max Power"].map(b => (
                <span key={b} className="text-xs bg-yellow-200 dark:bg-yellow-700/50 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full font-semibold">{b}</span>
              ))}
            </div>
          )}

          <button onClick={onClose} className={`mt-5 w-full py-3 rounded-2xl font-bold text-sm transition-all ${
            achieved
              ? "bg-yellow-400 hover:bg-yellow-500 text-yellow-900"
              : "bg-slate-600 hover:bg-slate-500 text-white"
          }`}>
            {achieved ? "Awesome! Let's keep going! 🚀" : "Got it! I'll do better tomorrow!"}
          </button>
        </div>
      </div>
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
  const confettiFiemerald = useRef(false);
  const [midnightResult, setMidnightResult] = useState<"achieved" | "missed" | null>(null);

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
  const goalSetDate = settings["dailySalaryGoalSetDate"] || todayStr();
  const today = todayStr();

  const todayProfit = entries
    .filter(e => e.date === today)
    .reduce((s, e) => s + (e.type === "expense" ? -e.amount : e.amount), 0);

  const pct = goal > 0 ? Math.min(100, (todayProfit / goal) * 100) : 0;
  const achieved = goal > 0 && todayProfit >= goal;
  const hasGoal = goal > 0;

  // Midnight check — show popup when a new day starts if goal was set
  useEffect(() => {
    if (!goal || allEntries.length === 0) return;
    const lastChecked = localStorage.getItem("goalLastCheckedDate");
    if (lastChecked === today) return; // already checked today
    // yesterday's date string
    const d = new Date(); d.setDate(d.getDate() - 1);
    const yesterday = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    if (yesterday < goalSetDate) { localStorage.setItem("goalLastCheckedDate", today); return; } // goal wasn't set yet yesterday
    const yesterdayProfit = allEntries.filter(e => e.type !== "expense" && e.date === yesterday).reduce((s, e) => s + e.amount, 0);
    setMidnightResult(yesterdayProfit >= goal ? "achieved" : "missed");
    localStorage.setItem("goalLastCheckedDate", today);
  }, [today, goal, goalSetDate, allEntries]);

  // Fire confetti once when achieved
  useEffect(() => {
    if (achieved && !confettiFiemerald.current) {
      confettiFiemerald.current = true;
      setTimeout(fireConfetti, 400);
      setTimeout(fireConfetti, 1200);
    }
    if (!achieved) confettiFiemerald.current = false;
  }, [achieved]);

  // Build goal history — only days AFTER the goal was first set, with actual entries
  const goalHistory: GoalHistoryItem[] = [];
  if (goal > 0) {
    for (let i = 1; i <= 60; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
      if (ds < goalSetDate) break; // stop at the day the goal was set
      const dayEntries = allEntries.filter(e => e.date === ds);
      if (dayEntries.length === 0) continue;
      const dayProfit = dayEntries.filter(e => e.type !== "expense").reduce((s, e) => s + e.amount, 0);
      goalHistory.push({ date: ds, profit: dayProfit, goal, achieved: dayProfit >= goal });
    }
  }
  const historyAchieved = goalHistory.filter(h => h.achieved).length;

  function saveGoal() {
    const v = parseFloat(goalInput);
    if (!v || v <= 0) return;
    saveSetting.mutate({ key: "dailySalaryGoal", value: String(v) });
    // Record the date the goal was first set — never overwrite once set
    if (!settings["dailySalaryGoalSetDate"]) {
      saveSetting.mutate({ key: "dailySalaryGoalSetDate", value: todayStr() });
    }
  }

  return (
    <>
    <div className="space-y-4">
      {/* Goal Card */}
      <div className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-500 ${
        achieved
          ? "border-yellow-400 bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50 dark:from-yellow-900/20 dark:via-orange-900/20 dark:to-amber-900/20 shadow-lg shadow-yellow-200/50 dark:shadow-yellow-900/30"
          : hasGoal
          ? "border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/10 dark:to-green-900/10"
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
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${achieved ? "bg-yellow-400 shadow-lg shadow-yellow-300/50" : "bg-emerald-100 dark:bg-emerald-900/30"}`}>
                <Target size={18} className={achieved ? "text-white" : "text-emerald-600 dark:text-emerald-400"} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-[#E4E6EB]">Daily Salary Goal</h3>
                <p className="text-[10px] text-gray-400 dark:text-[#B0B3B8]">Today's challenge</p>
              </div>
            </div>
            {!editingGoal ? (
              <button onClick={() => { setGoalInput(goal > 0 ? String(goal) : ""); setEditingGoal(true); }}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors px-2 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
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
                  className="w-28 bg-white dark:bg-[#3A3B3C] border border-emerald-300 dark:border-emerald-600 rounded-lg px-2 py-1 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400"
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
                <span className={`text-lg font-bold ${achieved ? "text-yellow-500" : pct >= 75 ? "text-emerald-500" : pct >= 50 ? "text-emerald-500" : "text-gray-400"}`}>
                  {pct.toFixed(0)}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-4 bg-gray-100 dark:bg-[#3A3B3C] rounded-full overflow-hidden mb-4 shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden ${
                    achieved
                      ? "bg-gradient-to-r from-yellow-400 via-orange-400 to-emerald-400"
                      : pct >= 75
                      ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                      : pct >= 50
                      ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                      : "bg-gradient-to-r from-emerald-300 to-emerald-400"
                  }`}
                  style={{ width: `${pct}%` }}
                >
                  {/* Shimmer inside bar */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </div>
              </div>

              {/* Goku + Speech Bubble */}
              <div className="flex flex-col items-center pt-2">
                {/* Speech bubble cloud above head */}
                <div className="relative mb-1 max-w-xs w-full">
                  <div className={`rounded-2xl px-4 py-3 text-center shadow-lg border-2 ${
                    achieved
                      ? "bg-yellow-400 border-yellow-500 text-yellow-900"
                      : "bg-white dark:bg-gray-100 border-gray-200 text-gray-900"
                  }`}>
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      {achieved ? <Trophy size={14} className="text-yellow-800" /> : <Flame size={14} className="text-emerald-500" />}
                      <span className="text-xs font-bold">
                        {achieved ? "Goal Achieved! 🏆" : pct >= 75 ? "Almost There!" : pct >= 50 ? "Keep Going!" : pct > 0 ? "Still Going Strong!" : "Start Your Journey!"}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium leading-relaxed">
                      {achieved
                        ? "Congratulations! You achieved your daily salary goal! Keep pushing beyond your limits!"
                        : pct >= 75
                        ? "Almost there! Give it everything — you are so close to the goal!"
                        : pct >= 50
                        ? "More than halfway! Your power is growing — don't stop now!"
                        : pct > 0
                        ? "The day is not over yet! Keep earning — every peso brings you closer!"
                        : "Set your power level and start your journey — you can do it!"}
                    </p>
                    {!achieved && (
                      <p className="text-[10px] font-mono mt-1 text-emerald-600">₱{fmt(Math.max(0, goal - todayProfit))} remaining today</p>
                    )}
                    {achieved && (
                      <div className="flex gap-1 mt-2 justify-center flex-wrap">
                        {["💪 MAX", "⚡ Super Saiyan", "🌟 Crusher"].map(b => (
                          <span key={b} className="text-[10px] bg-yellow-600/30 px-2 py-0.5 rounded-full font-medium">{b}</span>
                        ))}
                      </div>
                    )}
                    {/* Bubble tail pointing down */}
                    <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[12px] ${achieved ? "border-t-yellow-400" : "border-t-white dark:border-t-gray-100"}`} />
                  </div>
                </div>
                {/* Goku GIF — no background, just the character */}
                <CharacterGif mode={achieved ? "celebrate" : "encourage"} />
              </div>
            </>
          )}
        </div>
      </div>

    </div>

    {/* Midnight result popup */}
    {midnightResult && (
      <MidnightPopup result={midnightResult} onClose={() => setMidnightResult(null)} />
    )}
    </>
  );
}
