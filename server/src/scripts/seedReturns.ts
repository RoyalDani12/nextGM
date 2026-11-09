import dotenv from "dotenv";
dotenv.config();

import { prisma } from "../config/db.js";

async function main() {
  console.log("Seeding returns and refunds...");

  // 1. Get shops, customers, and orders
  const nikeShop = await prisma.shop.findFirst({ where: { slug: "nike-store" } });
  const techShop = await prisma.shop.findFirst({ where: { slug: "nextg-tech-store" } });
  const customer = await prisma.user.findFirst({ where: { role: "CUSTOMER" } });

  if (!nikeShop || !techShop || !customer) {
    throw new Error("Missing prerequisite shop or customer records.");
  }

  // Ensure techShop order is DELIVERED so it can have return requests
  const techOrder = await prisma.order.findFirst({
    where: { shopId: techShop.id },
    include: { items: true },
  });
  if (techOrder) {
    await prisma.order.update({
      where: { id: techOrder.id },
      data: { status: "DELIVERED" },
    });
  }

  // Get all delivered orders with items
  const deliveredOrders = await prisma.order.findMany({
    where: { status: "DELIVERED" },
    include: { items: true, shop: true },
  });

  console.log(`Found ${deliveredOrders.length} delivered orders to attach return claims.`);

  // Clean up any existing returns to seed cleanly
  await prisma.returnStatusHistory.deleteMany();
  await prisma.returnItem.deleteMany();
  await prisma.returnRequest.deleteMany();

  // Return Claim 1: Nike Store - REQUESTED (Needs Review), Resolution: REFUND
  const order1 = deliveredOrders.find((o) => o.shopId === nikeShop.id && o.items.length > 0);
  if (order1 && order1.items[0]) {
    const return1 = await prisma.returnRequest.create({
      data: {
        orderId: order1.id,
        customerId: customer.id,
        status: "REQUESTED",
        reason: "QUALITY_ISSUE",
        resolution: "REFUND",
        customerNote: "The stitching on the side panel is unraveling right out of the box. Requesting a full refund.",
        evidenceUrls: [
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
        ],
        items: {
          create: [{ orderItemId: order1.items[0].id, quantity: 1 }],
        },
        statusHistory: {
          create: [
            {
              status: "REQUESTED",
              note: "Return claim filed by customer with photographic evidence.",
            },
          ],
        },
      },
    });
    console.log("Created Return Claim 1 (REQUESTED - Nike):", return1.id);
  }

  // Return Claim 2: Nike Store - APPROVED, Resolution: REPLACEMENT
  const order2 = deliveredOrders.filter((o) => o.shopId === nikeShop.id && o.items.length > 0)[1] || order1;
  if (order2 && order2.items[0]) {
    const return2 = await prisma.returnRequest.create({
      data: {
        orderId: order2.id,
        customerId: customer.id,
        status: "APPROVED",
        reason: "DAMAGED",
        resolution: "REPLACEMENT",
        customerNote: "The sole arrived cracked on the heel. Would love a replacement pair if available.",
        sellerNote: "Approved return. Please ship the damaged pair using our return label.",
        evidenceUrls: [
          "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80",
        ],
        items: {
          create: [{ orderItemId: order2.items[0].id, quantity: 1 }],
        },
        statusHistory: {
          create: [
            { status: "REQUESTED", note: "Customer submitted replacement claim." },
            { status: "APPROVED", note: "Seller verified photos and approved return." },
          ],
        },
      },
    });
    console.log("Created Return Claim 2 (APPROVED - Nike):", return2.id);
  }

  // Return Claim 3: Nike Store - ITEM_RECEIVED, Resolution: REFUND
  const order3 = deliveredOrders.filter((o) => o.shopId === nikeShop.id && o.items.length > 0)[2] || order1;
  if (order3 && order3.items[0]) {
    const return3 = await prisma.returnRequest.create({
      data: {
        orderId: order3.id,
        customerId: customer.id,
        status: "ITEM_RECEIVED",
        reason: "WRONG_ITEM",
        resolution: "REFUND",
        customerNote: "Received size 8 instead of size 10. Shipped back the package.",
        sellerNote: "Package inspected at warehouse. Contents confirmed in original packaging. Ready for refund release.",
        evidenceUrls: [
          "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80",
        ],
        items: {
          create: [{ orderItemId: order3.items[0].id, quantity: 1 }],
        },
        statusHistory: {
          create: [
            { status: "REQUESTED", note: "Wrong size delivered; customer requested refund." },
            { status: "UNDER_REVIEW", note: "Seller reviewing order dispatch records." },
            { status: "APPROVED", note: "Return shipment authorized." },
            { status: "ITEM_RECEIVED", note: "Returned goods inspected and logged in inventory." },
          ],
        },
      },
    });
    console.log("Created Return Claim 3 (ITEM_RECEIVED - Nike):", return3.id);
  }

  // Return Claim 4: NextG Tech Store - UNDER_REVIEW, Resolution: REFUND
  if (techOrder && techOrder.items[0]) {
    const return4 = await prisma.returnRequest.create({
      data: {
        orderId: techOrder.id,
        customerId: customer.id,
        status: "UNDER_REVIEW",
        reason: "NOT_AS_DESCRIBED",
        resolution: "REFUND",
        customerNote: "The mouse sensor disconnects randomly after 10 minutes of use. Specs stated Bluetooth 5.2.",
        evidenceUrls: [
          "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80",
        ],
        items: {
          create: [{ orderItemId: techOrder.items[0].id, quantity: 1 }],
        },
        statusHistory: {
          create: [
            { status: "REQUESTED", note: "Claim submitted by customer." },
            { status: "UNDER_REVIEW", note: "Merchant technical team is checking batch firmware logs." },
          ],
        },
      },
    });
    console.log("Created Return Claim 4 (UNDER_REVIEW - Tech):", return4.id);
  }

  // Create an additional order + settled REFUNDED return for complete showcase
  const sampleProduct = await prisma.product.findFirst({
    where: { shopId: nikeShop.id },
    include: { variants: true },
  });

  if (sampleProduct) {
    const checkout = await prisma.checkout.create({
      data: {
        idempotencyKey: `chk-seed-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        customerId: customer.id,
        status: "COMPLETED",
        totalAmount: 120,
      },
    });

    const refundedOrder = await prisma.order.create({
      data: {
        checkoutId: checkout.id,
        idempotencyKey: `ord-seed-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        shopId: nikeShop.id,
        customerId: customer.id,
        status: "REFUNDED",
        totalAmount: 120,
        items: {
          create: [
            {
              productId: sampleProduct.id,
              variantId: sampleProduct.variants[0]?.id,
              quantity: 1,
              unitPrice: 120,
            },
          ],
        },
        statusHistory: {
          create: [
            { status: "CONFIRMED", note: "Order placed." },
            { status: "DELIVERED", note: "Delivered to customer." },
            { status: "REFUNDED", note: "Refund settled by administrator." },
          ],
        },
      },
      include: { items: true },
    });

    const return5 = await prisma.returnRequest.create({
      data: {
        orderId: refundedOrder.id,
        customerId: customer.id,
        status: "REFUNDED",
        reason: "DAMAGED",
        resolution: "REFUND",
        customerNote: "Sole detached during delivery. Package was heavily crushed.",
        sellerNote: "Confirmed carrier damage.",
        adminNote: "Admin reviewed carrier claim and released full refund $120.00 to customer card.",
        resolvedAt: new Date(),
        evidenceUrls: [
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
        ],
        items: {
          create: [{ orderItemId: refundedOrder.items[0]!.id, quantity: 1 }],
        },
        statusHistory: {
          create: [
            { status: "REQUESTED", note: "Customer submitted return claim." },
            { status: "APPROVED", note: "Return approved." },
            { status: "ITEM_RECEIVED", note: "Warehouse logged package." },
            { status: "REFUND_PENDING", note: "Refund initiated." },
            { status: "REFUNDED", note: "Payment reversed and credited back to customer." },
          ],
        },
      },
    });
    console.log("Created Return Claim 5 (REFUNDED - Nike):", return5.id);
  }

  const finalCount = await prisma.returnRequest.count();
  console.log(`Successfully seeded! Total return claims now in DB: ${finalCount}`);
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
