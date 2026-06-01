import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@gmail.com";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Admin already exists:", existing.email);
    return;
  }
  const password = await bcrypt.hash("Lester00", 12);
  const securityAnswer = await bcrypt.hash("admin", 12);
  const user = await prisma.user.create({
    data: {
      name: "Admin",
      email,
      password,
      role: "admin",
      securityQuestion: "What is your favorite color?",
      securityAnswer,
    },
  });
  console.log("Admin account created:", user.email);
  console.log("Email:    admin@gmail.com");
  console.log("Password: Lester00");
}

main().catch(console.error).finally(() => prisma.$disconnect());
