import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { SECURITY_QUESTIONS } from "@/lib/security-questions";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  securityQuestion: z.string().min(1),
  securityAnswer: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }
    const { name, email, password, securityQuestion, securityAnswer } = parsed.data;

    if (!SECURITY_QUESTIONS.includes(securityQuestion)) {
      return NextResponse.json({ error: "Invalid security question." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

    const [hashed, hashedAnswer] = await Promise.all([
      bcrypt.hash(password, 12),
      bcrypt.hash(securityAnswer.trim().toLowerCase(), 12),
    ]);

    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: "user", securityQuestion, securityAnswer: hashedAnswer },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    console.error("Register error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
