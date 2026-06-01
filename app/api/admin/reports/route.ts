import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(s: any) { return s?.user?.role === "admin"; }

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const dateFilter = from && to ? {
    createdAt: { gte: new Date(from), lte: new Date(to + "T23:59:59") }
  } : {};

  const [users, accounts, transactions, salary] = await Promise.all([
    prisma.user.findMany({ where: dateFilter, select: { createdAt: true, role: true } }),
    prisma.account.findMany({ where: dateFilter, select: { createdAt: true, used: true, limit: true } }),
    prisma.transaction.findMany({ where: dateFilter, select: { createdAt: true, type: true, amount: true } }),
    prisma.salaryEntry.findMany({ where: dateFilter, select: { date: true, type: true, amount: true } }),
  ]);

  // Monthly user registrations (last 6 months)
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { label: d.toLocaleString("en", { month: "short", year: "2-digit" }), month: d.getMonth(), year: d.getFullYear() };
  });

  const usersByMonth = months.map(m => ({
    label: m.label,
    users: users.filter(u => {
      const d = new Date(u.createdAt);
      return d.getMonth() === m.month && d.getFullYear() === m.year;
    }).length,
  }));

  const txByMonth = months.map(m => ({
    label: m.label,
    add: transactions.filter(t => { const d = new Date(t.createdAt); return d.getMonth() === m.month && d.getFullYear() === m.year && t.type === "Add"; }).length,
    deduct: transactions.filter(t => { const d = new Date(t.createdAt); return d.getMonth() === m.month && d.getFullYear() === m.year && t.type === "Deduct"; }).length,
  }));

  const totalProfit = salary.filter(e => e.type !== "expense").reduce((s, e) => s + e.amount, 0);
  const totalExpense = salary.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0);

  return NextResponse.json({
    totals: {
      users: users.length, accounts: accounts.length,
      transactions: transactions.length, salary: salary.length,
      profit: totalProfit, expense: totalExpense,
    },
    usersByMonth, txByMonth,
    rawSalary: salary,
    rawTransactions: transactions.slice(0, 500),
  });
}
