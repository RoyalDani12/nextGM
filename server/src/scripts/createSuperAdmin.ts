import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcrypt";
import { prisma } from "../config/db.js";

async function main() {
  const args = process.argv.slice(2);
  const email = args[0] || process.env.ADMIN_EMAIL || "admin@nextg.com";
  const password = args[1] || process.env.ADMIN_PASSWORD || "Password123!";
  const name = args[2] || "Super Admin";

  console.log(`🔐 Creating or updating Super Admin account for: ${email}...`);

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      isEmailVerified: true,
      ...(args[1] ? { password: hashedPassword } : {}), // only update password if explicitly provided
    },
    create: {
      name,
      email,
      password: hashedPassword,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      isEmailVerified: true,
      profile: {
        create: {
          phone: "+1 555-0100",
          city: "San Francisco",
          country: "United States",
        },
      },
    },
  });

  console.log("\n=======================================================");
  console.log("✅ SUPER ADMIN READY TO ACCESS PORTAL (/superadmin)");
  console.log("=======================================================");
  console.log(`Email:    ${user.email}`);
  console.log(`Role:     ${user.role}`);
  console.log(`Status:   ${user.status}`);
  if (args[1] || !args[0]) {
    console.log(`Password: ${password}`);
  }
  console.log("=======================================================\n");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("❌ Failed to create/update Super Admin:", err);
  process.exit(1);
});
