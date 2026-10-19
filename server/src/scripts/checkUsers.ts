import dotenv from "dotenv";
dotenv.config();
import { prisma } from "../config/db.js";

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  console.log(`\n📋 ALL USERS IN DATABASE (${users.length} total)\n`);
  console.log("─".repeat(80));
  for (const u of users) {
    console.log(`  [${u.role.padEnd(12)}] ${u.status.padEnd(12)} | ${u.email.padEnd(35)} | ${u.name}`);
  }
  console.log("─".repeat(80));
  await prisma.$disconnect();
}

main().catch(console.error);
