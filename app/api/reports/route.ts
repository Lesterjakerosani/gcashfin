import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "daily";

  const now = new Date();
  const MSHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const entryNet = (e: any) => e.type === "expense" ? -e.amount : e.amount;
  const pad = (n: number) => String(n).padStart(2, "0");
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;

  const [salary, accounts, transactions] = await Promise.all([
    prisma.salaryEntry.findMany({ where: { userId } }),
    prisma.account.findMany({ where: { userId } }),
    prisma.transaction.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
  ]);

  if (type === "daily") {
    const todayEntries = salary.filter((e: any) => e.date === todayStr);
    const todayProfit = todayEntries.reduce((s: number, e: any) => s + entryNet(e), 0);
    const todayTx = transactions.filter((t: any) => t.createdAt.toISOString().slice(0,10) === todayStr).length;
    const last7: { label: string; v: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const ds = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
      const v = salary.filter((e: any) => e.date === ds).reduce((s: number, e: any) => s + entryNet(e), 0);
      last7.push({ label: MSHORT[d.getMonth()] + " " + d.getDate(), v: Math.max(0, v) });
    }
    return NextResponse.json({ todayProfit, todayTx, activeAccounts: accounts.filter((a: any) => !a.archived).length, last7 });
  }

  if (type === "monthly") {
    const getMN = (m: number, y: number) => {
      const prefix = `${y}-${pad(m+1)}`;
      return salary.filter((e: any) => e.date.startsWith(prefix)).reduce((s: number, e: any) => s + entryNet(e), 0);
    };
    const thisT = getMN(now.getMonth(), now.getFullYear());
    const lastD = new Date(now.getFullYear(), now.getMonth()-1, 1);
    const lastT = getMN(lastD.getMonth(), lastD.getFullYear());
    const growth = lastT ? ((thisT - lastT) / Math.abs(lastT) * 100).toFixed(1) + "%" : "—";
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
      months.push({ label: MSHORT[d.getMonth()] + " " + String(d.getFullYear()).slice(2), v: Math.max(0, getMN(d.getMonth(), d.getFullYear())) });
    }
    return NextResponse.json({ thisMonth: thisT, lastMonth: lastT, growth, months });
  }

  if (type === "accounts") {
    return NextResponse.json(accounts.map((a: any) => ({
      ...a,
      available: Math.max(0, a.limit - a.used),
      pct: a.limit ? ((a.used / a.limit) * 100).toFixed(1) : "0",
    })));
  }

  if (type === "transactions") {
    const totalAdded = transactions.filter((t: any) => t.type === "Add").reduce((s: number, t: any) => s + t.amount, 0);
    const totalDeducted = transactions.filter((t: any) => t.type === "Deduct").reduce((s: number, t: any) => s + t.amount, 0);
    return NextResponse.json({ total: transactions.length, totalAdded, totalDeducted, transactions: transactions.slice(0, 100) });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
