import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { email },
    select: { securityQuestion: true },
  });

  if (!user || !user.securityQuestion) {
    return NextResponse.json({ error: "No account found with that email, or security question not configured." }, { status: 404 });
  }

  return NextResponse.json({ question: user.securityQuestion });
}
