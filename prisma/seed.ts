import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashed = await bcrypt.hash("admin123", 12);
  const user = await prisma.user.upsert({
    where: { email: "admin@gcashfin.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@gcashfin.com",
      password: hashed,
      role: "admin",
    },
  });
  console.log("Seeded user:", user.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
