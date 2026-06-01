import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@gcashfin.com";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Admin already exists:", existing.email);
    return;
  }
  const password = await bcrypt.hash("Admin@123456", 12);
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
  console.log("Email:    admin@gcashfin.com");
  console.log("Password: Admin@123456");
}

main().catch(console.error).finally(() => prisma.$disconnect());
