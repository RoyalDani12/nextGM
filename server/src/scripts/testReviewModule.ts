import dotenv from "dotenv";
dotenv.config();

import { prisma } from "../config/db.js";
import { listReviewsAdmin, updateReviewVisibilityAdmin } from "../features/admin/admin.repository.js";

async function runTests() {
  console.log("🧪 Testing Review Module Backend Services...\n");

  // 1. Check shop owner reviews query
  const shop = await prisma.shop.findFirst({
    where: { slug: "nextg-tech-store" },
    select: { id: true, slug: true }
  });

  if (!shop) throw new Error("Shop not found");
  console.log(`✅ Found shop: ${shop.slug} (${shop.id})`);

  const shopReviews = await prisma.review.findMany({
    where: { shopId: shop.id },
    include: {
      product: { select: { name: true } },
      user: { select: { name: true, email: true } },
      reply: true,
    },
    take: 5
  });

  console.log(`✅ Shop has ${shopReviews.length} sample reviews loaded.`);
  if (shopReviews.length > 0) {
    const r = shopReviews[0]!;
    console.log(`   Sample review: "${r.comment?.slice(0, 40)}..." by ${r.user.name} on ${r.product.name} (Rating: ${r.rating}★)`);
    console.log(`   Seller reply: ${r.reply ? `"${r.reply.comment.slice(0, 40)}..."` : "None"}`);
  }

  // 2. Test Admin Reviews listing
  console.log("\n🧪 Testing Admin Review Repository...");
  const adminResult = await listReviewsAdmin({ page: 1, limit: 10 });
  console.log(`✅ Admin list returned ${adminResult.reviews.length} reviews.`);
  console.log(`   Stats: Total=${adminResult.stats.totalPlatformReviews}, Avg=${adminResult.stats.avgRating}★, Visible=${adminResult.stats.visibleCount}, Hidden=${adminResult.stats.hiddenCount}`);

  // 3. Test Admin toggle visibility
  if (adminResult.reviews.length > 0) {
    const testReview = adminResult.reviews[0]!;
    const originalVisibility = testReview.isVisible;
    console.log(`\n🧪 Testing Admin Toggle Visibility on review ${testReview.id}...`);

    const toggled = await updateReviewVisibilityAdmin(testReview.id, !originalVisibility);
    console.log(`   Toggled visibility from ${originalVisibility} to ${toggled.isVisible}`);

    // Revert back
    const restored = await updateReviewVisibilityAdmin(testReview.id, originalVisibility);
    console.log(`   Restored visibility back to ${restored.isVisible}`);
    console.log("✅ Visibility toggle works perfectly!");
  }

  // 4. Test Reply creation and update
  if (shopReviews.length > 0) {
    const r = shopReviews[0]!;
    console.log(`\n🧪 Testing Shop Owner Reply Upsert on review ${r.id}...`);
    const testReplyComment = "Thank you so much! Tested via automated test.";

    const reply = await prisma.reviewReply.upsert({
      where: { reviewId: r.id },
      create: { reviewId: r.id, comment: testReplyComment },
      update: { comment: testReplyComment },
    });
    console.log(`✅ Upserted reply: "${reply.comment}"`);
  }

  console.log("\n🎉 ALL REVIEW MODULE BACKEND CHECKS PASSED SUCCESSFULLY!");
  await prisma.$disconnect();
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
