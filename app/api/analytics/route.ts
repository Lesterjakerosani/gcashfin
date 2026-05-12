import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const now = new Date();
  const [accounts, salary, transactions] = await Promise.all([
    prisma.account.findMany({ where: { userId } }),
    prisma.salaryEntry.findMany({ where: { userId }, orderBy: { date: "asc" } }),
    prisma.transaction.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 500 }),
  ]);

  const entryNet = (e: any) => e.type === "expense" ? -e.amount : e.amount;

  // All-time profit
  const allTime = salary.reduce((s: number, e: any) => s + entryNet(e), 0);

  // Best month
  const mMap: Record<string, number> = {};
  salary.forEach((e: any) => {
    const d = new Date(e.date + "T00:00:00");
    const k = `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()]} ${d.getFullYear()}`;
    mMap[k] = (mMap[k] || 0) + entryNet(e);
  });
  let bestMonthVal = 0, bestMonthLabel = "—";
  Object.entries(mMap).forEach(([k, v]) => { if (v > bestMonthVal) { bestMonthVal = v; bestMonthLabel = k; } });

  // Best day
  const dMap: Record<string, number> = {};
  salary.forEach((e: any) => { dMap[e.date] = (dMap[e.date] || 0) + entryNet(e); });
  let bestDayVal = 0, bestDayLabel = "—";
  Object.entries(dMap).forEach(([k, v]) => { if (v > bestDayVal) { bestDayVal = v; bestDayLabel = k; } });

  // 30-day trend
  const trend = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    const v = salary.filter((e: any) => e.date === ds).reduce((s: number, e: any) => s + entryNet(e), 0);
    trend.push({ label: String(d.getDate()), date: ds, v });
  }

  // 6-month bar
  const monthly = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth(), y = d.getFullYear();
    const pad = (n: number) => String(n).padStart(2, "0");
    const prefix = `${y}-${pad(m + 1)}`;
    const v = salary.filter((e: any) => e.date.startsWith(prefix)).reduce((s: number, e: any) => s + entryNet(e), 0);
    const MSHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    monthly.push({ label: MSHORT[m], v: Math.max(0, v) });
  }

  // Top accounts
  const topAccounts = [...accounts].sort((a, b) => b.used - a.used).slice(0, 5);

  return NextResponse.json({
    allTime, bestMonthVal, bestMonthLabel, bestDayVal, bestDayLabel,
    totalAccounts: accounts.filter((a: any) => !a.archived).length,
    trend, monthly, topAccounts,
    usageData: accounts.filter((a: any) => !a.archived).slice(0, 8).map((a: any) => ({
      label: a.model.slice(0, 7), v: a.used, color: a.color,
    })),
  });
}
