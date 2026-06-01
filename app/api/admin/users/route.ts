import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(session: any) { return session?.user?.role === "admin"; }

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, email: true, role: true, createdAt: true,
      _count: { select: { accounts: true, transactions: true, salaryEntries: true } },
    },
  });
  return NextResponse.json(users);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "User ID required" }, { status: 400 });
  const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (target?.role === "admin") return NextResponse.json({ error: "Cannot delete admin account" }, { status: 400 });
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
