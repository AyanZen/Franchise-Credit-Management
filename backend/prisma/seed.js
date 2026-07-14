import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashed = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: hashed,
      name: "Administrator",
      role: "admin",
    },
  });

  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { termDays: 15, graceDays: 5, reminderIntervalDays: 2, emailRemindersEnabled: true },
  });

  console.log("Seeded admin user (admin / admin123) and default settings");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
