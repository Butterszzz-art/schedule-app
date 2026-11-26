import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Dev-only fixture: /signup is the real way to create an account now.
// This just gives a fresh local/branch database one known login to test with.
async function main() {
  const email = process.env.AUTH_USER_EMAIL;
  const password = process.env.AUTH_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Set AUTH_USER_EMAIL and AUTH_USER_PASSWORD in .env before seeding."
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: { password: passwordHash },
    create: {
      email: email.toLowerCase(),
      password: passwordHash,
      settings: { create: {} },
    },
  });

  console.log(`Seeded user: ${user.email}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
