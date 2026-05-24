"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fmt } from "@/lib/utils";
import { BarChart2, Calendar, TrendingUp, Award } from "lucide-react";

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

  const todayRef = useRef<HTMLTableRowElement>(null);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();

  const { data: reportData } = useQuery({
    queryKey: ["reports", "daily-all"],
    queryFn: () => fetch(`/api/reports?type=daily`).then(r => r.json()),
  });

  const { dates, monthMap, totalYearProfit, selectedMonthProfit, bestDay, daysWithProfit } = useMemo(() => {
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

    const periodDates = selectedMonth === "all" ? allDates : mMap[selectedMonth];
    const monthProfit = periodDates.reduce((sum, d) => sum + d.profit, 0);

    let bestDay = { dateStr: "", month: 0, day: 0, profit: 0 };
    let daysWithProfit = 0;
    periodDates.forEach(d => {
      if (d.profit > bestDay.profit) bestDay = d;
      if (d.profit > 0) daysWithProfit++;
    });

    return {
      dates: periodDates,
      monthMap: mMap,
      totalYearProfit: yearTotal,
      selectedMonthProfit: monthProfit,
      bestDay,
      daysWithProfit,
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

  const tableRows = useMemo(() => {
    const rows: React.ReactNode[] = [];
    let lastMonth = -1;

    dates.forEach((dateObj) => {
      const isToday =
        dateObj.month === currentMonth &&
        dateObj.day === currentDate &&
        (selectedMonth === "all" || selectedMonth === String(currentMonth));

      if (selectedMonth === "all" && dateObj.month !== lastMonth) {
        lastMonth = dateObj.month;
        rows.push(
          <tr key={`sep-${dateObj.month}`}>
            <td colSpan={4} className="px-5 py-2 bg-gray-50 dark:bg-[#18191A] border-b border-gray-100 dark:border-[#3E4042]">
              <span className="text-[11px] font-semibold text-gray-400 dark:text-[#B0B3B8] uppercase tracking-widest">
                {MONTHS[dateObj.month]} {currentYear}
              </span>
            </td>
          </tr>
        );
      }

      const dayName = new Date(dateObj.dateStr + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" });
      const barWidth = Math.max((dateObj.profit / maxProfit) * 100, 0);

      rows.push(
        <tr
          key={dateObj.dateStr}
          ref={isToday ? todayRef : null}
          className={`tr-hover ${isToday ? "bg-emerald-50 dark:bg-emerald-900/10" : ""}`}
        >
          <td className="td pl-5 w-40">
            <div className="flex items-center gap-2.5">
              {isToday
                ? <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse" />
                : <span className="w-1.5 h-1.5 flex-shrink-0" />
              }
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-[#E4E6EB]">
                  {MONTHS[dateObj.month].slice(0, 3)} {String(dateObj.day).padStart(2, "0")}
                </div>
                <div className="text-[10px] text-gray-400 dark:text-[#B0B3B8]">{dateObj.dateStr}</div>
              </div>
            </div>
          </td>
          <td className="td w-16 hidden sm:table-cell">
            <span className="text-xs text-gray-400 dark:text-[#B0B3B8]">{dayName}</span>
          </td>
          <td className="td">
            <div className="h-1.5 bg-gray-100 dark:bg-[#3A3B3C] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${dateObj.profit > 0 ? "bg-emerald-500" : ""}`}
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </td>
          <td className="td text-right pr-5 w-36">
            <div className={`font-mono text-sm tabular-nums ${
              dateObj.profit > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-gray-300 dark:text-slate-600"
            }`}>
              {dateObj.profit > 0 ? `+₱${fmt(dateObj.profit)}` : "—"}
            </div>
            {isToday && (
              <div className="mt-0.5 flex justify-end">
                <span className="badge-green text-[10px]">Today</span>
              </div>
            )}
          </td>
        </tr>
      );
    });

    return rows;
  }, [dates, maxProfit, currentMonth, currentDate, selectedMonth, currentYear]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Financial Reports</h1>
          <p className="page-subtitle">{currentYear} · Daily profit tracking and analysis</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-[#242526] border border-gray-200 dark:border-[#3E4042] rounded-xl px-3 py-2 shadow-sm">
          <Calendar size={13} className="text-gray-400 dark:text-[#B0B3B8] flex-shrink-0" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent text-sm text-gray-700 dark:text-[#E4E6EB] focus:outline-none cursor-pointer pr-1"
          >
            {MONTH_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 dark:text-[#B0B3B8] uppercase tracking-wider">
              {selectedMonth === "all" ? "Year Total" : MONTHS[Number(selectedMonth)]}
            </span>
            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
              <TrendingUp size={15} className="text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-gray-900 dark:text-[#E4E6EB]">
            ₱{fmt(selectedMonth === "all" ? totalYearProfit : selectedMonthProfit)}
          </div>
          <div className="mt-1 text-xs text-gray-400 dark:text-[#B0B3B8]">{daysWithProfit} profitable days</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 dark:text-[#B0B3B8] uppercase tracking-wider">Annual Total</span>
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <BarChart2 size={15} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-gray-900 dark:text-[#E4E6EB]">₱{fmt(totalYearProfit)}</div>
          <div className="mt-1 text-xs text-gray-400 dark:text-[#B0B3B8]">{currentYear} year-to-date</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 dark:text-[#B0B3B8] uppercase tracking-wider">Peak Day</span>
            <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
              <Award size={15} className="text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-gray-900 dark:text-[#E4E6EB]">
            {bestDay.profit > 0 ? `₱${fmt(bestDay.profit)}` : "—"}
          </div>
          <div className="mt-1 text-xs text-gray-400 dark:text-[#B0B3B8]">
            {bestDay.profit > 0 ? `${MONTHS[bestDay.month].slice(0, 3)} ${String(bestDay.day).padStart(2, "0")}, ${currentYear}` : "No data yet"}
          </div>
        </div>
      </div>

      {/* Daily Breakdown Table */}
      <div className="table-container">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-[#3E4042] flex items-center justify-between">
          <div>
            <h2 className="section-title">Daily Breakdown</h2>
            <p className="text-xs text-gray-400 dark:text-[#B0B3B8] mt-0.5">{dates.length} days · Auto-scrolls to today</p>
          </div>
          <span className="text-xs text-gray-300 dark:text-[#3E4042] hidden sm:block font-mono">{currentYear}</span>
        </div>

        <div className="max-h-[calc(100vh-460px)] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="th pl-5">Date</th>
                <th className="th hidden sm:table-cell">Day</th>
                <th className="th">Trend</th>
                <th className="th text-right pr-5">Profit</th>
              </tr>
            </thead>
            <tbody>
              {dates.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-gray-400 dark:text-[#B0B3B8] text-sm">
                    No data available.
                  </td>
                </tr>
              ) : tableRows}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
