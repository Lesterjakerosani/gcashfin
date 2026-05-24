import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  const monthPrefix = `${now.getFullYear()}-${pad(now.getMonth()+1)}`;
  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  const [accounts, transactions, salary] = await Promise.all([
    prisma.account.findMany({ where: { userId } }),
    prisma.transaction.findMany({ where: { userId } }),
    prisma.salaryEntry.findMany({ where: { userId } }),
  ]);

  const active = accounts.filter((a) => !a.archived);
  const totalBalance = active.reduce((s, a) => s + a.balance, 0);
  const totalUsed = active.reduce((s, a) => s + a.used, 0);
  const totalAvailable = active.reduce((s, a) => s + Math.max(0, a.limit - a.used), 0);
  const entryNet = (e: any) => e.type === "expense" ? -e.amount : e.amount;

  const monthlyProfit = salary.filter((e) => e.date.startsWith(monthPrefix)).reduce((s, e) => s + entryNet(e), 0);
  const dailyProfit = salary.filter((e) => e.date === todayStr).reduce((s, e) => s + entryNet(e), 0);

  const currentYear = now.getFullYear();
  let highestDay = 0, highestDate = "—";
  for (let month = 0; month < 12; month++) {
    const daysInMonth = new Date(currentYear, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const ds = `${currentYear}-${pad(month+1)}-${pad(day)}`;
      const v = salary.filter((e) => e.date === ds).reduce((s, e) => s + entryNet(e), 0);
      if (v > highestDay) { highestDay = v; highestDate = ds; }
    }
  }

  return NextResponse.json({
    totalAccounts: active.length, totalBalance, totalUsed,
    totalAvailable: totalAvailable,
    monthlyProfit, dailyProfit, highestDay, highestDate,
    totalTransactions: transactions.length,
    monthLabel: MONTHS[now.getMonth()] + " " + now.getFullYear(),
  });
}
