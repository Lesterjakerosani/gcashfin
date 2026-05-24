import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");
  const all = searchParams.get("all") === "true";

  let where: any = { userId };
  if (!all && month !== null && year !== null) {
    const m = parseInt(month);
    const y = parseInt(year);
    const pad = (n: number) => String(n).padStart(2, "0");
    const prefix = `${y}-${pad(m + 1)}`;
    where.date = { startsWith: prefix };
  }

  const entries = await prisma.salaryEntry.findMany({
    where,
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  try {
    const { date, type, amount, category, notes } = await req.json();
    if (!date || !type || !amount) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    const entry = await prisma.salaryEntry.create({
      data: { userId, date, type, amount: parseFloat(amount), category: category || (type === "profit" ? "Profit" : "General"), notes },
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
