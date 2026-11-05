import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcrypt";
import { prisma } from "../config/db.js";

async function main() {
  console.log("🌱 Seeding essential platform accounts and active store...");

  const defaultPassword = "Password123!";
  const hashedPassword = await bcrypt.hash(defaultPassword, 12);
  const adminPassword = await bcrypt.hash("admin@1212", 12);

  // 1. SUPER_ADMIN ACCOUNT (admin@gmail.com)
  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@gmail.com" },
    update: {
      password: adminPassword,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      isEmailVerified: true,
    },
    create: {
      name: "Super Admin",
      email: "admin@gmail.com",
      password: adminPassword,
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
  console.log("✅ Super Admin ready:", superAdmin.email);

  // 2. SHOP_OWNER ACCOUNT
  const shopOwner = await prisma.user.upsert({
    where: { email: "seller@nextg.com" },
    update: {
      password: hashedPassword,
      role: "SHOP_OWNER",
      status: "ACTIVE",
      isEmailVerified: true,
    },
    create: {
      name: "Alex Vance",
      email: "seller@nextg.com",
      password: hashedPassword,
      role: "SHOP_OWNER",
      status: "ACTIVE",
      isEmailVerified: true,
      profile: {
        create: {
          phone: "+1 555-0199",
          city: "Seattle",
          country: "United States",
        },
      },
    },
  });
  console.log("✅ Shop Owner ready:", shopOwner.email);

  // 3. ACTIVE SHOP FOR SHOP OWNER
  const activeShop = await prisma.shop.upsert({
    where: { slug: "nextg-tech-store" },
    update: {
      status: "ACTIVE",
      ownerId: shopOwner.id,
    },
    create: {
      ownerId: shopOwner.id,
      slug: "nextg-tech-store",
      status: "ACTIVE",
      profile: {
        create: {
          name: "NextG Tech Store",
          description: "Premium electronics, audio gear, and cutting-edge digital accessories.",
          phone: "+1 555-0199",
          email: "support@nextgtech.com",
          city: "Seattle",
          country: "United States",
        },
      },
      wallet: {
        create: {
          balance: 1250.0,
          payoutsEnabled: true,
        },
      },
      legalInfo: {
        create: {
          legalBusinessName: "NextG Technologies LLC",
          taxId: "US-987654321",
          entityType: "LLC",
        },
      },
    },
  });
  console.log("✅ Active Shop ready:", activeShop.slug, `(ID: ${activeShop.id})`);

  // Activate any existing shop owned by user (e.g. test-class-a)
  await prisma.shop.updateMany({
    where: { slug: "test-class-a" },
    data: { status: "ACTIVE" },
  });

  // Also reset dani21.dev@gmail.com password if present so user can use that too
  const daniUser = await prisma.user.findUnique({ where: { email: "dani21.dev@gmail.com" } });
  if (daniUser) {
    await prisma.user.update({
      where: { email: "dani21.dev@gmail.com" },
      data: { password: hashedPassword, isEmailVerified: true, status: "ACTIVE" },
    });
    console.log("✅ Existing user dani21.dev@gmail.com password updated to default");
  }

  // 4. ACTIVE PRODUCTS FOR THE ACTIVE SHOP
  const sampleProducts = [
    {
      name: "Pro Wireless Noise-Cancelling Headphones",
      slug: "pro-wireless-headphones",
      description: "Industry-leading active noise cancellation with 40-hour battery life and spatial audio.",
      basePrice: "249.99",
      stock: 45,
      sku: "NG-HD-001",
      type: "PHYSICAL" as const,
      status: "ACTIVE" as const,
      images: [
        {
          url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
          isPrimary: true,
        },
        {
          url: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80",
          isPrimary: false,
        },
      ],
    },
    {
      name: "Ultra-Slim Mechanical Wireless Keyboard",
      slug: "ultra-slim-mechanical-keyboard",
      description: "Low profile tactile switches with multi-device Bluetooth connectivity and RGB backlighting.",
      basePrice: "129.50",
      stock: 30,
      sku: "NG-KB-002",
      type: "PHYSICAL" as const,
      status: "ACTIVE" as const,
      images: [
        {
          url: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80",
          isPrimary: true,
        },
      ],
    },
    {
      name: "Ergonomic Precision Wireless Mouse",
      slug: "ergonomic-precision-mouse",
      description: "Customizable 8K DPI sensor with infinite scroll wheel and thumb rest designed for all-day comfort.",
      basePrice: "79.00",
      stock: 60,
      sku: "NG-MS-003",
      type: "PHYSICAL" as const,
      status: "ACTIVE" as const,
      images: [
        {
          url: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80",
          isPrimary: true,
        },
      ],
    },
    {
      name: "4K Ultra-HD Video Production Preset Pack",
      slug: "4k-video-preset-pack",
      description: "Over 50 cinematic color grading LUTs and audio transitions for professional creators.",
      basePrice: "49.00",
      stock: 999,
      sku: "NG-DG-004",
      type: "DIGITAL" as const,
      status: "ACTIVE" as const,
      images: [
        {
          url: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&q=80",
          isPrimary: true,
        },
      ],
    },
  ];

  for (const p of sampleProducts) {
    const existing = await prisma.product.findFirst({
      where: { shopId: activeShop.id, slug: p.slug },
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          name: p.name,
          description: p.description,
          basePrice: p.basePrice,
          stock: p.stock,
          status: p.status,
          type: p.type,
        },
      });
      // Ensure images are present
      await prisma.productImage.deleteMany({ where: { productId: existing.id } });
      await prisma.productImage.createMany({
        data: p.images.map((img) => ({
          productId: existing.id,
          url: img.url,
          isPrimary: img.isPrimary,
        })),
      });
    } else {
      await prisma.product.create({
        data: {
          shopId: activeShop.id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          basePrice: p.basePrice,
          stock: p.stock,
          sku: p.sku,
          type: p.type,
          status: p.status,
          images: {
            create: p.images.map((img) => ({
              url: img.url,
              isPrimary: img.isPrimary,
            })),
          },
        },
      });
    }
  }
  console.log("✅ 4 Active Products seeded for NextG Tech Store");

  // 5. CUSTOMER ACCOUNT
  const customer = await prisma.user.upsert({
    where: { email: "customer@nextg.com" },
    update: {
      password: hashedPassword,
      role: "CUSTOMER",
      status: "ACTIVE",
      isEmailVerified: true,
    },
    create: {
      name: "Jordan Smith",
      email: "customer@nextg.com",
      password: hashedPassword,
      role: "CUSTOMER",
      status: "ACTIVE",
      isEmailVerified: true,
      profile: {
        create: {
          phone: "+1 555-0144",
          address: "742 Evergreen Terrace",
          city: "Springfield",
          country: "United States",
        },
      },
    },
  });
  console.log("✅ Customer ready:", customer.email);

  console.log("\n=======================================================");
  console.log("🎉 ALL SEED ACCOUNTS READY WITH FULL CONTROL ACCESS");
  console.log("=======================================================");
  console.log("1. SUPER ADMIN:   admin@gmail.com (Password: admin@1212)");
  console.log("2. SHOP OWNER:    seller@nextg.com (Password: Password123!) (Shop: nextg-tech-store)");
  console.log("3. CUSTOMER:      customer@nextg.com (Password: Password123!)");
  console.log("4. DANI DEV:      dani21.dev@gmail.com (Password: Password123!) (Shop: test-class-a)");
  console.log("=======================================================\n");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
