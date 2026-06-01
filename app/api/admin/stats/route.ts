import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [totalUsers, totalAccounts, totalTransactions, totalSalaryEntries, recentUsers] = await Promise.all([
    prisma.user.count(),
    prisma.account.count(),
    prisma.transaction.count(),
    prisma.salaryEntry.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
  ]);

  return NextResponse.json({ totalUsers, totalAccounts, totalTransactions, totalSalaryEntries, recentUsers });
}
