import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/log-activity";

function isAdmin(s: any) { return s?.user?.role === "admin"; }

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const type = searchParams.get("type") || "accounts";

  if (type === "accounts") {
    const accounts = await prisma.account.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      where: search ? { OR: [
        { model: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { user: { name: { contains: search, mode: "insensitive" } } },
      ]} : undefined,
    });
    return NextResponse.json(accounts);
  }

  if (type === "transactions") {
    const transactions = await prisma.transaction.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
      where: search ? { OR: [
        { account: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { user: { name: { contains: search, mode: "insensitive" } } },
      ]} : undefined,
    });
    return NextResponse.json(transactions);
  }

  if (type === "salary") {
    const salary = await prisma.salaryEntry.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
      where: search ? { user: { name: { contains: search, mode: "insensitive" } } } : undefined,
    });
    return NextResponse.json(salary);
  }

  return NextResponse.json([]);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id, type } = await req.json();
  if (!id || !type) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  if (type === "account") await prisma.account.delete({ where: { id } });
  else if (type === "transaction") await prisma.transaction.delete({ where: { id } });
  else if (type === "salary") await prisma.salaryEntry.delete({ where: { id } });
  else return NextResponse.json({ error: "Invalid type" }, { status: 400 });

  await logActivity({ userName: session!.user!.name || "Admin", userEmail: session!.user!.email || "", action: `Deleted ${type} record`, details: `ID: ${id}` });
  return NextResponse.json({ ok: true });
}
