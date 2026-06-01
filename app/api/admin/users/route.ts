import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { logActivity } from "@/lib/log-activity";

function isAdmin(s: any) { return s?.user?.role === "admin"; }

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true,
      _count: { select: { accounts: true, transactions: true, salaryEntries: true } } },
  });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { name, email, password, role } = await req.json();
  if (!name || !email || !password) return NextResponse.json({ error: "Name, email and password required" }, { status: 400 });
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, password: hashed, role: role || "user" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  await logActivity({ userName: session!.user!.name || "Admin", userEmail: session!.user!.email || "", action: "Created user", details: `${name} (${email})` });
  return NextResponse.json(user, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id, name, email, role, password } = await req.json();
  if (!id) return NextResponse.json({ error: "User ID required" }, { status: 400 });
  const data: any = {};
  if (name) data.name = name;
  if (email) data.email = email;
  if (role) data.role = role;
  if (password) data.password = await bcrypt.hash(password, 12);
  const user = await prisma.user.update({ where: { id }, data, select: { id: true, name: true, email: true, role: true } });
  await logActivity({ userName: session!.user!.name || "Admin", userEmail: session!.user!.email || "", action: "Edited user", details: `${user.name} (${user.email})` });
  return NextResponse.json(user);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "User ID required" }, { status: 400 });
  const target = await prisma.user.findUnique({ where: { id }, select: { role: true, name: true, email: true } });
  if (target?.role === "admin") return NextResponse.json({ error: "Cannot delete admin account" }, { status: 400 });
  await prisma.user.delete({ where: { id } });
  await logActivity({ userName: session!.user!.name || "Admin", userEmail: session!.user!.email || "", action: "Deleted user", details: `${target?.name} (${target?.email})` });
  return NextResponse.json({ ok: true });
}
