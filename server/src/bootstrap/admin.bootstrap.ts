import bcrypt from "bcrypt";
import { prisma } from "../config/db.js";

/**
 * Automatically ensures the Super Admin account exists and has the correct password and active status on server startup.
 * Guarantees that production deployments (e.g. Render) always have an active superadmin account without manual DB seeding.
 */
export const ensureSuperAdmin = async () => {
  try {
    const adminEmail = process.env.SUPER_ADMIN_EMAIL || "admin@gmail.com";
    const adminPassword = process.env.SUPER_ADMIN_PASSWORD || "admin@1212";

    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        password: hashedPassword,
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        isEmailVerified: true,
      },
      create: {
        name: "Super Admin",
        email: adminEmail,
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

    console.log(`✓ Super Admin account ensured on startup: ${admin.email} (Role: ${admin.role})`);
  } catch (error) {
    // Non-blocking so server continues to boot even if DB connection has a transient delay
    console.error("⚠️ Failed to ensure Super Admin account on startup:", error);
  }
};
