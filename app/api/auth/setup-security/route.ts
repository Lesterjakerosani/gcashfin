import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SECURITY_QUESTIONS } from "@/lib/security-questions";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { securityQuestion, securityAnswer } = await req.json();

  if (!securityQuestion || !securityAnswer?.trim()) {
    return NextResponse.json({ error: "Question and answer are required." }, { status: 400 });
  }
  if (!SECURITY_QUESTIONS.includes(securityQuestion)) {
    return NextResponse.json({ error: "Invalid security question." }, { status: 400 });
  }

  const hashedAnswer = await bcrypt.hash(securityAnswer.trim().toLowerCase(), 12);

  await prisma.user.update({
    where: { id: (session.user as any).id },
    data: { securityQuestion, securityAnswer: hashedAnswer },
  });

  return NextResponse.json({ ok: true });
}
