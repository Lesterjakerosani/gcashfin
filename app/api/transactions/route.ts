import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const type = searchParams.get("type") || "";
  const date = searchParams.get("date") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(searchParams.get("perPage") || "15");

  const where: any = { userId };
  if (type) where.type = type;
  if (search) where.OR = [{ account: { contains: search, mode: "insensitive" } }, { phone: { contains: search } }, { id: { contains: search } }];
  if (date) {
    const d = new Date(date);
    const start = new Date(d); start.setHours(0,0,0,0);
    const end = new Date(d); end.setHours(23,59,59,999);
    where.createdAt = { gte: start, lte: end };
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page-1)*perPage, take: perPage }),
    prisma.transaction.count({ where }),
  ]);
  return NextResponse.json({ transactions, total, pages: Math.ceil(total/perPage) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  try {
    const { accountId, type, amount, notes } = await req.json();
    const amountNum = Number(amount || 0);
    if (!accountId || !type) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    if (type !== "Reset" && (!amountNum || amountNum <= 0)) return NextResponse.json({ error: "Enter a valid transaction amount" }, { status: 400 });

    const account = await prisma.account.findFirst({ where: { id: accountId, userId } });
    if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    let newUsed = account.used;
    if (type === "Add") newUsed = Math.min(account.limit, newUsed + amountNum);
    else if (type === "Deduct") newUsed = Math.max(0, newUsed - amountNum);
    else if (type === "Reset") newUsed = 0;

    const availableAfter = Math.max(0, account.limit - newUsed);

    const [tx] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          userId, accountId, type, amount: type === "Reset" ? 0 : amountNum,
          balAfter: availableAfter, phone: account.phone, account: account.model,
          category: account.category, notes, status: "Completed",
        },
      }),
      prisma.account.update({ where: { id: accountId }, data: { used: newUsed } }),
    ]);

    return NextResponse.json(tx, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
