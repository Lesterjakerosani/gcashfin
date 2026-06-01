import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { userId, resetToken, newPassword } = await req.json();

  if (!userId || !resetToken || !newPassword?.trim()) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { forgotPasswordToken: true, forgotPasswordTokenExpiry: true },
  });

  if (!user || user.forgotPasswordToken !== resetToken) {
    return NextResponse.json({ error: "Invalid or expired reset token." }, { status: 401 });
  }
  if (!user.forgotPasswordTokenExpiry || user.forgotPasswordTokenExpiry < new Date()) {
    return NextResponse.json({ error: "Reset token has expired. Please start over." }, { status: 401 });
  }

  const hashed = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed, forgotPasswordToken: null, forgotPasswordTokenExpiry: null },
  });

  return NextResponse.json({ ok: true });
}
