"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fmt } from "@/lib/utils";
import { BarChart2, Calendar, TrendingUp, Award, Download } from "lucide-react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const MONTH_OPTIONS = [
  { value: "all", label: "All Months" },
  ...MONTHS.map((month, i) => ({ value: String(i), label: month }))
];

export default function ReportsPage() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(() => String(now.getMonth()));
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const todayRef = useRef<HTMLTableRowElement>(null);
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();
  const currentYear = now.getFullYear();

  const { data: reportData } = useQuery({
    queryKey: ["reports", "daily-all", selectedYear],
    queryFn: () => fetch(`/api/reports?type=daily&year=${selectedYear}`).then(r => r.json()),
  });

  const { dates, totalYearProfit, totalYearExpense, selectedMonthProfit, selectedMonthExpense, bestDay, daysWithProfit, avgDaily } = useMemo(() => {
    const allDates: Array<{ dateStr: string; month: number; day: number; profit: number; expense: number; net: number }> = [];
    const mMap: { [key: string]: typeof allDates } = {};
    MONTHS.forEach((_, i) => { mMap[String(i)] = []; });

    for (let month = 0; month < 12; month++) {
      const daysInMonth = new Date(selectedYear, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${selectedYear}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const profit = reportData?.dailyProfits?.[dateStr] || 0;
        const expense = reportData?.dailyExpenses?.[dateStr] || 0;
        const net = profit - expense;
        const dateObj = { dateStr, month, day, profit, expense, net };
        allDates.push(dateObj);
        mMap[String(month)].push(dateObj);
      }
    }

    const yearProfit = allDates.reduce((s, d) => s + d.profit, 0);
    const yearExpense = allDates.reduce((s, d) => s + d.expense, 0);

    const periodDates = selectedMonth === "all" ? allDates : mMap[selectedMonth];
    const monthProfit = periodDates.reduce((s, d) => s + d.profit, 0);
    const monthExpense = periodDates.reduce((s, d) => s + d.expense, 0);

    let bestDay = { dateStr: "", month: 0, day: 0, profit: 0, expense: 0, net: 0 };
    let daysWithProfit = 0;
    periodDates.forEach(d => {
      if (d.profit > bestDay.profit) bestDay = d;
      if (d.profit > 0) daysWithProfit++;
    });

    const avgDaily = daysWithProfit > 0 ? monthProfit / daysWithProfit : 0;

    return {
      dates: periodDates,
      totalYearProfit: yearProfit,
      totalYearExpense: yearExpense,
      selectedMonthProfit: monthProfit,
      selectedMonthExpense: monthExpense,
      bestDay,
      daysWithProfit,
      avgDaily,
    };
  }, [reportData, selectedMonth, selectedYear]);

  useEffect(() => {
    if (!todayRef.current) return;
    setTimeout(() => {
      todayRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }, [selectedMonth, selectedYear]);

  const maxAbsNet = useMemo(() => Math.max(...dates.map(d => Math.abs(d.net)), 1), [dates]);

  function exportCSV() {
    const rows = [["Date", "Day", "Profit", "Expense", "Net"]];
    dates.forEach(d => {
      const dayName = new Date(d.dateStr + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" });
      rows.push([d.dateStr, dayName, String(d.profit), String(d.expense), String(d.net)]);
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const label = selectedMonth === "all" ? String(selectedYear) : `${MONTHS[Number(selectedMonth)]}_${selectedYear}`;
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = `report_${label}.csv`;
    a.click();
  }

  const years = Array.from({ length: 4 }, (_, i) => currentYear - 2 + i);

  const periodProfit = selectedMonth === "all" ? totalYearProfit : selectedMonthProfit;
  const periodExpense = selectedMonth === "all" ? totalYearExpense : selectedMonthExpense;
  const periodNet = periodProfit - periodExpense;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Financial Reports</h1>
          <p className="page-subtitle">{selectedYear} · Daily profit & expense tracking</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={exportCSV} className="btn-secondary gap-1.5 text-xs">
            <Download size={13} /> Export CSV
          </button>
          <div className="flex items-center gap-2 bg-white dark:bg-[#242526] border border-gray-200 dark:border-[#3E4042] rounded-xl px-3 py-2 shadow-sm">
            <Calendar size={13} className="text-gray-400 dark:text-[#B0B3B8] flex-shrink-0" />
            <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-sm text-gray-700 dark:text-[#E4E6EB] focus:outline-none cursor-pointer pr-1">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
              className="bg-transparent text-sm text-gray-700 dark:text-[#E4E6EB] focus:outline-none cursor-pointer pr-1">
              {MONTH_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 dark:text-[#B0B3B8] uppercase tracking-wider">
              {selectedMonth === "all" ? "Year Profit" : MONTHS[Number(selectedMonth)]}
            </span>
            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
              <TrendingUp size={15} className="text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">₱{fmt(periodProfit)}</div>
          <div className="mt-1 text-xs text-gray-400 dark:text-[#B0B3B8]">Exp: ₱{fmt(periodExpense)} · Net: {periodNet >= 0 ? "+" : ""}₱{fmt(periodNet)}</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 dark:text-[#B0B3B8] uppercase tracking-wider">Avg Daily Profit</span>
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <BarChart2 size={15} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-gray-900 dark:text-[#E4E6EB]">₱{fmt(avgDaily)}</div>
          <div className="mt-1 text-xs text-gray-400 dark:text-[#B0B3B8]">{daysWithProfit} profitable days</div>
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
            {bestDay.profit > 0 ? `${MONTHS[bestDay.month].slice(0, 3)} ${String(bestDay.day).padStart(2, "0")}, ${selectedYear}` : "No data yet"}
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 dark:text-[#B0B3B8] uppercase tracking-wider">Net Income</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${periodNet >= 0 ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
              <TrendingUp size={15} className={periodNet >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"} />
            </div>
          </div>
          <div className={`text-2xl font-semibold ${periodNet >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
            {periodNet >= 0 ? "+" : ""}₱{fmt(periodNet)}
          </div>
          <div className="mt-1 text-xs text-gray-400 dark:text-[#B0B3B8]">Profit minus expenses</div>
        </div>
      </div>

      {/* Daily Breakdown Table */}
      <div className="table-container">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-[#3E4042] flex items-center justify-between">
          <div>
            <h2 className="section-title">Daily Breakdown</h2>
            <p className="text-xs text-gray-400 dark:text-[#B0B3B8] mt-0.5">{dates.length} days · Auto-scrolls to today</p>
          </div>
          <span className="text-xs text-gray-300 dark:text-[#3E4042] hidden sm:block font-mono">{selectedYear}</span>
        </div>

        <div className="max-h-[calc(100vh-460px)] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="th pl-5">Date</th>
                <th className="th hidden sm:table-cell">Day</th>
                <th className="th text-right">Profit</th>
                <th className="th text-right">Expense</th>
                <th className="th text-right pr-5">Net</th>
              </tr>
            </thead>
            <tbody>
              {dates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-400 dark:text-[#B0B3B8] text-sm">No data available.</td>
                </tr>
              ) : (() => {
                const rows: React.ReactNode[] = [];
                let lastMonth = -1;
                dates.forEach((dateObj) => {
                  const isToday =
                    selectedYear === currentYear &&
                    dateObj.month === currentMonth &&
                    dateObj.day === currentDate &&
                    (selectedMonth === "all" || selectedMonth === String(currentMonth));

                  if (selectedMonth === "all" && dateObj.month !== lastMonth) {
                    lastMonth = dateObj.month;
                    rows.push(
                      <tr key={`sep-${dateObj.month}`}>
                        <td colSpan={5} className="px-5 py-2 bg-gray-50 dark:bg-[#18191A] border-b border-gray-100 dark:border-[#3E4042]">
                          <span className="text-[11px] font-semibold text-gray-400 dark:text-[#B0B3B8] uppercase tracking-widest">
                            {MONTHS[dateObj.month]} {selectedYear}
                          </span>
                        </td>
                      </tr>
                    );
                  }

                  const dayName = new Date(dateObj.dateStr + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" });

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
                      <td className="td text-right">
                        <span className={`font-mono text-sm tabular-nums ${dateObj.profit > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-gray-300 dark:text-slate-600"}`}>
                          {dateObj.profit > 0 ? `+₱${fmt(dateObj.profit)}` : "—"}
                        </span>
                        {isToday && (
                          <div className="mt-0.5 flex justify-end">
                            <span className="badge-green text-[10px]">Today</span>
                          </div>
                        )}
                      </td>
                      <td className="td text-right">
                        <span className={`font-mono text-sm tabular-nums ${dateObj.expense > 0 ? "text-red-500 dark:text-red-400" : "text-gray-300 dark:text-slate-600"}`}>
                          {dateObj.expense > 0 ? `-₱${fmt(dateObj.expense)}` : "—"}
                        </span>
                      </td>
                      <td className="td text-right pr-5">
                        <span className={`font-mono text-sm tabular-nums ${dateObj.net > 0 ? "text-emerald-600 dark:text-emerald-400" : dateObj.net < 0 ? "text-red-500 dark:text-red-400" : "text-gray-300 dark:text-slate-600"}`}>
                          {dateObj.net !== 0 ? `${dateObj.net > 0 ? "+" : ""}₱${fmt(dateObj.net)}` : "—"}
                        </span>
                      </td>
                    </tr>
                  );
                });
                return rows;
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
