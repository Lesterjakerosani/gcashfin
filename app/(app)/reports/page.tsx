"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fmt } from "@/lib/utils";

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

  // Fetch data for all 30 days
  const { data: reportData } = useQuery({
    queryKey: ["reports", "daily-all"],
    queryFn: () => fetch(`/api/reports?type=daily`).then(r => r.json()),
  });

  // Generate all dates for the year and filter
  const { dates, monthMap, totalYearProfit, selectedMonthProfit } = useMemo(() => {
    const allDates: Array<{ dateStr: string; month: number; day: number; profit: number }> = [];
    const mMap: { [key: string]: Array<{ dateStr: string; month: number; day: number; profit: number }> } = {};

    // Initialize month map
    MONTHS.forEach((_, i) => {
      mMap[String(i)] = [];
    });

    // Generate all days of the year
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

    // Calculate total profits
    let yearTotal = 0;
    allDates.forEach(d => {
      yearTotal += d.profit;
    });

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

  // Auto-scroll to today's date
  useEffect(() => {
    if (!todayRef.current) return;
    
    setTimeout(() => {
      todayRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }, [selectedMonth]);

  // Calculate max profit for bar scaling
  const maxProfit = useMemo(() => {
    return Math.max(...dates.map(d => d.profit), 1);
  }, [dates]);

  return (
    <div className="min-h-screen bg-[rgba(10,10,10,0.98)]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-4xl tracking-[4px] text-white mb-1">
          FINANCIAL <span className="text-[#e74c3c]">REPORTS</span>
        </h1>
        <p className="text-[#888] text-sm">Daily profit tracking and analysis</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-[rgba(15,15,15,0.92)] border border-white/[0.07] rounded-lg p-4">
          <div className="text-[10px] uppercase tracking-widest text-[#888] mb-2">
            {selectedMonth === "all" ? "Total Year Profit" : `${MONTHS[Number(selectedMonth)]} Profit`}
          </div>
          <div className="font-display text-3xl tracking-wider text-white">
            ₱{fmt(selectedMonth === "all" ? totalYearProfit : selectedMonthProfit)}
          </div>
        </div>
        <div className="bg-[rgba(15,15,15,0.92)] border border-white/[0.07] rounded-lg p-4">
          <div className="text-[10px] uppercase tracking-widest text-[#888] mb-2">Year Total Profit</div>
          <div className="font-display text-3xl tracking-wider text-white">₱{fmt(totalYearProfit)}</div>
        </div>
      </div>

      {/* Month Filter */}
      <div className="mb-6">
        <label className="block text-[10px] uppercase tracking-widest text-[#888] mb-2">Filter by Month</label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-full sm:w-48 bg-[rgba(15,15,15,0.92)] border border-white/[0.07] text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-[#e74c3c] transition-colors"
        >
          {MONTH_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value} className="bg-[#1a1a1a]">
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Daily Profit List */}
      <div className="bg-[rgba(15,15,15,0.92)] border border-white/[0.07] rounded-lg overflow-hidden">
        <div className="max-h-[calc(100vh-400px)] overflow-y-auto">
          <div className="divide-y divide-white/[0.05]">
            {dates.length === 0 ? (
              <div className="text-center py-10 text-[#555] text-xs">No data available.</div>
            ) : (
              dates.map((dateObj, idx) => {
                const isToday =
                  dateObj.month === currentMonth &&
                  dateObj.day === currentDate &&
                  selectedMonth === "all" || selectedMonth === String(currentMonth);

                return (
                  <div
                    key={dateObj.dateStr}
                    ref={isToday ? todayRef : null}
                    className={`flex items-center gap-3 px-4 py-3 ${
                      isToday ? "bg-white/[0.03] border-l-2 border-[#e74c3c]" : ""
                    } hover:bg-white/[0.02] transition-colors`}
                  >
                    {/* Date */}
                    <div className="w-24 flex-shrink-0">
                      <div className="text-sm font-semibold text-white">
                        {MONTHS[dateObj.month].slice(0, 3)} {dateObj.day}
                      </div>
                      <div className="text-[10px] text-[#555]">{dateObj.dateStr}</div>
                    </div>

                    {/* Profit Bar */}
                    <div className="flex-1 min-w-0">
                      <div className="h-5 bg-white/[0.04] rounded-sm overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 flex items-center justify-end pr-2 ${
                            dateObj.profit > 0 ? "bg-[#c0392b]" : "bg-[#444]"
                          }`}
                          style={{
                            width: `${Math.max(
                              ((dateObj.profit / maxProfit) * 100),
                              dateObj.profit > 0 ? 2 : 0
                            )}%`
                          }}
                        >
                          {dateObj.profit > 0 && (
                            <span className="text-[10px] text-white/90 font-mono-num whitespace-nowrap">
                              ₱{fmt(dateObj.profit)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Amount on Right */}
                    <div className="w-24 flex-shrink-0 text-right">
                      <div className={`text-sm font-semibold font-mono-num ${
                        dateObj.profit > 0 ? "text-white" : "text-[#555]"
                      }`}>
                        ₱{fmt(dateObj.profit)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Info Text */}
      <p className="text-[#555] text-xs mt-4 text-center">
        Showing {dates.length} days • Auto-scrolls to today
      </p>
    </div>
  );
}
