import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  const account = await prisma.account.findFirst({ where: { id: params.id, userId } });
  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(account);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  try {
    const body = await req.json();
    const account = await prisma.account.updateMany({
      where: { id: params.id, userId },
      data: {
        model: body.model, phone: body.phone, balance: body.balance,
        limit: body.limit, category: body.category, color: body.color,
        notes: body.notes, archived: body.archived,
      },
    });
    if (account.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const updated = await prisma.account.findFirst({ where: { id: params.id, userId } });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  await prisma.account.deleteMany({ where: { id: params.id, userId } });
  return NextResponse.json({ ok: true });
}
