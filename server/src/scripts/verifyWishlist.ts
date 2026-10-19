import dotenv from "dotenv";
dotenv.config();

import { prisma } from "../config/db.js";

async function verifyWishlist() {
  console.log("🧪 Verifying Customer Wishlist Feature...\n");

  const customer = await prisma.user.findFirst({
    where: { email: "customer@nextg.com" },
    select: { id: true, email: true, name: true }
  });

  if (!customer) throw new Error("Customer not found");
  console.log(`✅ Found test customer: ${customer.name} (${customer.email})`);

  // Query wishlist items for customer
  const wishlistItems = await prisma.wishlistItem.findMany({
    where: { userId: customer.id },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          basePrice: true,
          stock: true,
          status: true,
          type: true,
          shop: {
            select: {
              id: true,
              slug: true,
              profile: { select: { name: true, logo: true } }
            }
          },
          images: { take: 2, orderBy: { isPrimary: "desc" }, select: { url: true } }
        }
      }
    }
  });

  console.log(`✅ Customer has ${wishlistItems.length} saved wishlist items.`);
  for (const item of wishlistItems.slice(0, 3)) {
    console.log(`   • ${item.product.name} — $${Number(item.product.basePrice).toFixed(2)} (Stock: ${item.product.stock}) | Merchant: ${item.product.shop?.profile?.name || item.product.shop?.slug}`);
  }

  // Verify stock calculation
  const inStock = wishlistItems.filter(i => (i.product?.stock ?? 0) > 0).length;
  const outOfStock = wishlistItems.length - inStock;
  const totalValue = wishlistItems.reduce((acc, i) => acc + Number(i.product.basePrice || 0), 0);

  console.log(`\n📊 Wishlist Summary Metrics:`);
  console.log(`   In-Stock: ${inStock}`);
  console.log(`   Out-Of-Stock: ${outOfStock}`);
  console.log(`   Estimated Total Value: $${totalValue.toFixed(2)}`);

  console.log("\n🎉 WISHLIST VERIFICATION COMPLETED SUCCESSFULLY!");
  await prisma.$disconnect();
}

verifyWishlist().catch((err) => {
  console.error("❌ Wishlist verification failed:", err);
  process.exit(1);
});
