import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const { email, answer } = await req.json();
  if (!email?.trim() || !answer?.trim()) {
    return NextResponse.json({ error: "Email and answer are required." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, securityAnswer: true },
  });

  if (!user || !user.securityAnswer) {
    return NextResponse.json({ error: "Account not found or security question not configured." }, { status: 404 });
  }

  const match = await bcrypt.compare(answer.trim().toLowerCase(), user.securityAnswer);
  if (!match) {
    return NextResponse.json({ error: "Incorrect security answer. Please try again." }, { status: 401 });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await prisma.user.update({
    where: { id: user.id },
    data: { forgotPasswordToken: token, forgotPasswordTokenExpiry: expiry },
  });

  return NextResponse.json({ resetToken: token, userId: user.id });
}
