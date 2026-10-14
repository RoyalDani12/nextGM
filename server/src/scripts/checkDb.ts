import dotenv from "dotenv";
dotenv.config();

import { prisma } from "../config/db.js";

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      isEmailVerified: true,
    },
  });

  const shops = await prisma.shop.findMany({
    select: {
      id: true,
      slug: true,
      status: true,
      owner: { select: { email: true } },
      profile: { select: { name: true } },
    },
  });

  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      status: true,
      basePrice: true,
      platformCategoryId: true,
      platformCategory: { select: { name: true, slug: true } },
      shop: { select: { slug: true } },
      images: { select: { url: true, isPrimary: true } },
    },
  });

  const categories = await prisma.category.findMany();
  const productCategories = await prisma.productCategory.findMany();

  console.log("=== USERS IN DB ===");
  console.log(JSON.stringify(users, null, 2));
  console.log("=== SHOPS IN DB ===");
  console.log(JSON.stringify(shops, null, 2));
  console.log(`=== TOTAL PRODUCTS IN DB: ${products.length} ===`);
  console.log(JSON.stringify(products, null, 2));
  console.log(`=== PLATFORM CATEGORIES: ${categories.length} ===`);
  console.log(JSON.stringify(categories, null, 2));
  console.log(`=== SHOP PRODUCT CATEGORIES: ${productCategories.length} ===`);
  console.log(JSON.stringify(productCategories, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
