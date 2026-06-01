import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(s: any) { return s?.user?.role === "admin"; }

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [totalUsers, totalAccounts, totalTransactions, totalSalaryEntries, totalActivities, recentUsers, recentActivity] = await Promise.all([
    prisma.user.count({ where: { role: "user" } }),
    prisma.account.count(),
    prisma.transaction.count(),
    prisma.salaryEntry.count(),
    prisma.activityLog.count(),
    prisma.user.findMany({ where: { role: "user" }, orderBy: { createdAt: "desc" }, take: 5,
      select: { id: true, name: true, email: true, role: true, createdAt: true } }),
    prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
  ]);

  return NextResponse.json({ totalUsers, totalAccounts, totalTransactions, totalSalaryEntries, totalActivities, recentUsers, recentActivity });
}
