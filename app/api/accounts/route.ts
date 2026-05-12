import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  model: z.string().min(1, "Phone model required"),
  phone: z.string().min(1, "Phone number required"),
  balance: z.number().default(0),
  limit: z.number().default(100000),
  category: z.string().default("Personal"),
  color: z.string().default("#c0392b"),
  notes: z.string().optional(),
  archived: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const status = searchParams.get("status") || "";

  const whereBase: any = { userId };
  if (search) whereBase.OR = [
    { model: { contains: search, mode: "insensitive" } },
    { phone: { contains: search } },
  ];
  if (category) whereBase.category = category;
  if (status === "Archived") whereBase.archived = true;
  else if (status === "Active") whereBase.archived = false;

  const accounts = await prisma.account.findMany({
    where: whereBase,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(accounts);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    const account = await prisma.account.create({
      data: { ...parsed.data, userId, used: 0, archived: false },
    });
    return NextResponse.json(account, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
