import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { validatePassword } from "../src/utils/password.js";
import { BCRYPT_ROUNDS } from "../src/config/security.js";

const prisma = new PrismaClient();
const isProduction = process.env.NODE_ENV === "production";

async function main() {
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { termDays: 15, graceDays: 5, reminderIntervalDays: 2, emailRemindersEnabled: true },
  });

  const existingAdmin = await prisma.user.findUnique({ where: { username: "admin" } });
  if (existingAdmin) {
    console.log("Seed skipped: admin user already exists.");
    return;
  }

  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (isProduction) {
    if (!adminPassword) {
      console.log("Seed skipped in production: set SEED_ADMIN_PASSWORD to create the first admin.");
      return;
    }
    const passwordError = validatePassword(adminPassword);
    if (passwordError) {
      throw new Error(`SEED_ADMIN_PASSWORD invalid: ${passwordError}`);
    }
  }

  const password = isProduction ? adminPassword : (adminPassword || "admin123");
  const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);

  await prisma.user.create({
    data: {
      username: "admin",
      password: hashed,
      name: "Administrator",
      role: "admin",
    },
  });

  if (isProduction) {
    console.log("Seeded admin user in production. Change the password after first login.");
  } else {
    console.log(`Seeded admin user (admin / ${adminPassword ? "custom password" : "admin123"}) and default settings`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
