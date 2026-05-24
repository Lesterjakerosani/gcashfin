"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fmt } from "@/lib/utils";
import { BarChart2, Calendar } from "lucide-react";

interface DailyProfit {
  [date: string]: number;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const MONTH_OPTIONS = [
  { value: "all", label: "All Months" },
  ...MONTHS.map((month, i) => ({ value: String(i), label: month }))
];

export default function ReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return String(now.getMonth());
  });

  const todayRef = useRef<HTMLDivElement>(null);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();

  const { data: reportData } = useQuery({
    queryKey: ["reports", "daily-all"],
    queryFn: () => fetch(`/api/reports?type=daily`).then(r => r.json()),
  });

  const { dates, monthMap, totalYearProfit, selectedMonthProfit } = useMemo(() => {
    const allDates: Array<{ dateStr: string; month: number; day: number; profit: number }> = [];
    const mMap: { [key: string]: Array<{ dateStr: string; month: number; day: number; profit: number }> } = {};

    MONTHS.forEach((_, i) => { mMap[String(i)] = []; });

    for (let month = 0; month < 12; month++) {
      const daysInMonth = new Date(currentYear, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentYear}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const profit = (reportData?.dailyProfits?.[dateStr] || 0);
        const dateObj = { dateStr, month, day, profit: Math.max(0, profit) };
        allDates.push(dateObj);
        mMap[String(month)].push(dateObj);
      }
    }

    let yearTotal = 0;
    allDates.forEach(d => { yearTotal += d.profit; });

    const monthProfit = selectedMonth === "all"
      ? yearTotal
      : mMap[selectedMonth].reduce((sum, d) => sum + d.profit, 0);

    return {
      dates: selectedMonth === "all" ? allDates : mMap[selectedMonth],
      monthMap: mMap,
      totalYearProfit: yearTotal,
      selectedMonthProfit: monthProfit
    };
  }, [reportData, selectedMonth, currentYear]);

  useEffect(() => {
    if (!todayRef.current) return;
    setTimeout(() => {
      todayRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }, [selectedMonth]);

  const maxProfit = useMemo(() => {
    return Math.max(...dates.map(d => d.profit), 1);
  }, [dates]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Financial Reports</h1>
          <p className="page-subtitle">Daily profit tracking and analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-gray-400 dark:text-[#B0B3B8]" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="select-field w-auto"
          >
            {MONTH_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 dark:text-[#B0B3B8] uppercase tracking-wider">
              {selectedMonth === "all" ? "Total Year Profit" : `${MONTHS[Number(selectedMonth)]} Profit`}
            </span>
            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
              <BarChart2 size={15} className="text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="text-2xl font-medium text-gray-900 dark:text-[#E4E6EB]">
            ₱{fmt(selectedMonth === "all" ? totalYearProfit : selectedMonthProfit)}
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 dark:text-[#B0B3B8] uppercase tracking-wider">Year Total Profit</span>
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <BarChart2 size={15} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="text-2xl font-medium text-gray-900 dark:text-[#E4E6EB]">₱{fmt(totalYearProfit)}</div>
        </div>
      </div>

      {/* Daily Profit List */}
      <div className="table-container">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-[#3E4042]">
          <h2 className="section-title">Daily Breakdown</h2>
          <p className="text-xs text-gray-400 dark:text-[#B0B3B8] mt-0.5">Showing {dates.length} days • Auto-scrolls to today</p>
        </div>
        <div className="max-h-[calc(100vh-400px)] overflow-y-auto divide-y divide-gray-100 dark:divide-slate-700/50">
          {dates.length === 0 ? (
            <div className="text-center py-10 text-gray-400 dark:text-[#B0B3B8] text-sm">No data available.</div>
          ) : (
            dates.map((dateObj) => {
              const isToday =
                dateObj.month === currentMonth &&
                dateObj.day === currentDate &&
                (selectedMonth === "all" || selectedMonth === String(currentMonth));

              return (
                <div
                  key={dateObj.dateStr}
                  ref={isToday ? todayRef : null}
                  className={`flex items-center gap-4 px-5 py-3 transition-colors ${
                    isToday
                      ? "bg-emerald-50 dark:bg-emerald-900/10 border-l-2 border-emerald-500"
                      : "hover:bg-gray-50 dark:hover:bg-[#3A3B3C]/20"
                  }`}
                >
                  <div className="w-20 flex-shrink-0">
                    <div className="text-sm font-semibold text-gray-800 dark:text-[#E4E6EB]">
                      {MONTHS[dateObj.month].slice(0, 3)} {dateObj.day}
                    </div>
                    <div className="text-[10px] text-gray-400 dark:text-[#B0B3B8]">{dateObj.dateStr}</div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="h-4 bg-gray-100 dark:bg-[#3A3B3C] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          dateObj.profit > 0 ? "bg-emerald-500" : "bg-gray-200 dark:bg-[#3A3B3C]"
                        }`}
                        style={{
                          width: `${Math.max(((dateObj.profit / maxProfit) * 100), dateObj.profit > 0 ? 2 : 0)}%`
                        }}
                      />
                    </div>
                  </div>

                  <div className="w-24 flex-shrink-0 text-right">
                    <div className={`text-sm font-mono ${
                      dateObj.profit > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-gray-300 dark:text-slate-600"
                    }`}>
                      ₱{fmt(dateObj.profit)}
                    </div>
                    {isToday && <div className="text-[10px] badge-green mt-0.5">Today</div>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
