/**
 * ═══════════════════════════════════════════════════════════════
 *  NXEIO FULL PLATFORM SEED  —  seedAll.ts
 *  Run:  npx tsx src/scripts/seedAll.ts
 * ═══════════════════════════════════════════════════════════════
 *
 *  Creates:
 *   ✅ 1  Super Admin
 *   ✅ 2  Shop Owners  (with ACTIVE shops, wallets, legal info)
 *   ✅ 4  Customers    (ACTIVE, email-verified)
 *   ✅ Platform categories (4 parents → 18 subcategories)
 *   ✅ 2+ products per subcategory  (~36 products total)
 *   ✅ Product images, variants, wishlists
 *   ✅ DELIVERED orders for every customer on every product
 *      (so each customer CAN leave a review on any product)
 *   ✅ Reviews  (3–4 per product, with star ratings + comments)
 *   ✅ Seller replies on ~50 % of reviews
 *
 *  ALL ACCOUNTS PASSWORD:  Password123!
 * ═══════════════════════════════════════════════════════════════
 */

import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcrypt";
import slugify from "slugify";
import { prisma } from "../config/db.js";

// ────────────────────────────────────────────────────────────────
//  HELPERS
// ────────────────────────────────────────────────────────────────
const slug = (name: string) => slugify(name, { lower: true, strict: true });

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

// ────────────────────────────────────────────────────────────────
//  STATIC DATA
// ────────────────────────────────────────────────────────────────

const PASS = "Password123!";

const CATEGORY_TREE: Record<string, string[]> = {
  "APPAREL & STYLE": [
    "Men's & Women's Wear",
    "Footwear & Sneakers",
    "Bags & Leather Goods",
    "Custom Merchandise",
    "Watches & Jewelry",
  ],
  "TECH & ELECTRONICS": [
    "Smartphones & Accessories",
    "Audio & Headphones",
    "Power Banks & Chargers",
    "Smart Home Hardware",
  ],
  "HOME & WORKSPACE": [
    "Ergonomic Desk Setup",
    "Mechanical Keyboards",
    "Office & Ambient Lighting",
    "Desk Organizers",
    "Decor & Furniture",
  ],
  "SPORTS & PERSONAL CARE": [
    "Fitness Gear & Equipment",
    "Outdoor & Camping",
    "Skincare & Grooming",
    "Travel Accessories",
  ],
};

// Category → product templates  (name, description, basePrice, stock, images[])
type ProductTemplate = {
  name: string;
  description: string;
  basePrice: string;
  stock: number;
  images: string[];
  variants?: { name: string; price: string; stock: number }[];
};

const PRODUCTS_BY_CATEGORY: Record<string, ProductTemplate[]> = {
  "Men's & Women's Wear": [
    {
      name: "Classic Slim-Fit Oxford Shirt",
      description: "100% premium Egyptian cotton, wrinkle-resistant finish. Perfect for office or casual wear.",
      basePrice: "39.99",
      stock: 80,
      images: [
        "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&q=80",
        "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80",
      ],
      variants: [
        { name: "S / White", price: "39.99", stock: 20 },
        { name: "M / White", price: "39.99", stock: 30 },
        { name: "L / Navy", price: "41.99", stock: 30 },
      ],
    },
    {
      name: "Relaxed Linen Summer Dress",
      description: "Breathable linen blend, midi length, adjustable waist tie. Available in earth tones.",
      basePrice: "54.99",
      stock: 60,
      images: ["https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=800&q=80"],
    },
  ],
  "Footwear & Sneakers": [
    {
      name: "Urban Runner Pro Sneakers",
      description: "Lightweight foam midsole, breathable mesh upper, non-slip rubber outsole.",
      basePrice: "89.99",
      stock: 50,
      images: [
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
        "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800&q=80",
      ],
      variants: [
        { name: "EU 40", price: "89.99", stock: 10 },
        { name: "EU 42", price: "89.99", stock: 20 },
        { name: "EU 44", price: "89.99", stock: 20 },
      ],
    },
    {
      name: "Leather Chelsea Boots",
      description: "Full-grain leather upper, elasticated side panels, stacked heel. Timeless silhouette.",
      basePrice: "139.00",
      stock: 35,
      images: ["https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800&q=80"],
    },
  ],
  "Bags & Leather Goods": [
    {
      name: "Minimalist Leather Crossbody Bag",
      description: "Genuine full-grain leather, adjustable strap, RFID-blocking inner pocket.",
      basePrice: "79.00",
      stock: 40,
      images: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80"],
    },
    {
      name: "Canvas Tech Backpack 30L",
      description: "Water-resistant waxed canvas, padded laptop sleeve, USB-A pass-through.",
      basePrice: "64.99",
      stock: 55,
      images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80"],
    },
  ],
  "Custom Merchandise": [
    {
      name: "Embroidered Logo Cap",
      description: "6-panel structured cap, premium cotton twill, custom embroidery on front.",
      basePrice: "24.99",
      stock: 100,
      images: ["https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&q=80"],
    },
    {
      name: "Premium Unisex Hoodie",
      description: "Heavyweight 380 GSM fleece, kangaroo pocket, ribbed cuffs. Custom screen print.",
      basePrice: "44.99",
      stock: 70,
      images: ["https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800&q=80"],
      variants: [
        { name: "S / Black", price: "44.99", stock: 20 },
        { name: "M / Black", price: "44.99", stock: 25 },
        { name: "L / Grey", price: "44.99", stock: 25 },
      ],
    },
  ],
  "Watches & Jewelry": [
    {
      name: "Minimalist Quartz Watch",
      description: "Sapphire crystal glass, 5ATM water resistance, genuine leather strap.",
      basePrice: "119.00",
      stock: 30,
      images: ["https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&q=80"],
    },
    {
      name: "Sterling Silver Stackable Rings Set",
      description: "925 sterling silver, set of 3 dainty bands. Hypoallergenic, tarnish-resistant.",
      basePrice: "34.99",
      stock: 90,
      images: ["https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80"],
    },
  ],
  "Smartphones & Accessories": [
    {
      name: "MagSafe Phone Case — Crystal Clear",
      description: "Military-grade drop protection, MagSafe compatible, anti-yellowing TPU back.",
      basePrice: "22.99",
      stock: 120,
      images: ["https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&q=80"],
      variants: [
        { name: "iPhone 15 Pro", price: "22.99", stock: 40 },
        { name: "iPhone 15", price: "22.99", stock: 40 },
        { name: "iPhone 14 Pro", price: "19.99", stock: 40 },
      ],
    },
    {
      name: "Tempered Glass Screen Protector — 3-Pack",
      description: "9H hardness, ultra-thin 0.3mm, oleophobic coating. Easy alignment installation.",
      basePrice: "12.99",
      stock: 200,
      images: ["https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&q=80"],
    },
  ],
  "Audio & Headphones": [
    {
      name: "Pro Wireless Noise-Cancelling Headphones",
      description: "Industry-leading ANC with 40-hour battery life and spatial audio technology.",
      basePrice: "249.99",
      stock: 45,
      images: [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
        "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80",
      ],
    },
    {
      name: "True Wireless Earbuds — ANC Pro",
      description: "Hybrid active noise cancellation, 8hr + 24hr case life, IPX5 water resistant.",
      basePrice: "99.99",
      stock: 70,
      images: ["https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80"],
    },
  ],
  "Power Banks & Chargers": [
    {
      name: "65W GaN USB-C Compact Charger",
      description: "Powers laptop + phone simultaneously. Foldable US plug, gallium nitride tech.",
      basePrice: "45.00",
      stock: 90,
      images: ["https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&q=80"],
    },
    {
      name: "20,000mAh MagSafe Wireless Power Bank",
      description: "15W wireless + 22.5W wired output. LCD battery display, pass-through charging.",
      basePrice: "69.99",
      stock: 55,
      images: ["https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&q=80"],
    },
  ],
  "Smart Home Hardware": [
    {
      name: "Smart LED Light Strip — 5M RGBIC",
      description: "16M colors, music sync, voice control (Alexa/Google). Self-adhesive backing.",
      basePrice: "34.99",
      stock: 75,
      images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80"],
    },
    {
      name: "WiFi Smart Plug — 4-Pack",
      description: "Energy monitoring, voice control, scheduling. No hub required.",
      basePrice: "29.99",
      stock: 110,
      images: ["https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80"],
    },
  ],
  "Ergonomic Desk Setup": [
    {
      name: "Height-Adjustable Monitor Arm — Dual",
      description: "VESA 75/100mm, full motion articulation, cable management. Holds up to 9kg each.",
      basePrice: "79.99",
      stock: 30,
      images: ["https://images.unsplash.com/photo-1593640408182-31c228b7c45c?w=800&q=80"],
    },
    {
      name: "Ergonomic Lumbar Support Chair Cushion",
      description: "Memory foam core, breathable mesh cover, adjustable strap. Reduces back pain.",
      basePrice: "36.99",
      stock: 65,
      images: ["https://images.unsplash.com/photo-1588534510807-86dfb5ed5d5b?w=800&q=80"],
    },
  ],
  "Mechanical Keyboards": [
    {
      name: "Ultra-Slim Wireless Mechanical Keyboard",
      description: "Low-profile tactile switches, multi-device Bluetooth, RGB backlighting.",
      basePrice: "129.50",
      stock: 30,
      images: ["https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80"],
    },
    {
      name: "75% Hot-Swap Mechanical Keyboard Kit",
      description: "South-facing PCB, gasket mount, POM plate, knob. Pre-lubed stabilizers.",
      basePrice: "159.00",
      stock: 20,
      images: ["https://images.unsplash.com/photo-1601445638532-3c6f6c3aa1d6?w=800&q=80"],
    },
  ],
  "Office & Ambient Lighting": [
    {
      name: "LED Desk Lamp with Wireless Charger",
      description: "10 brightness levels, 3 color temps, USB-A port, 15W Qi charging base.",
      basePrice: "42.99",
      stock: 55,
      images: ["https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=800&q=80"],
    },
    {
      name: "Smart Key Light — Streaming Edition",
      description: "2800–6500K, app-controlled, ultra-flat diffuser, studio-grade illumination.",
      basePrice: "74.99",
      stock: 35,
      images: ["https://images.unsplash.com/photo-1565814636199-ae8133055c1c?w=800&q=80"],
    },
  ],
  "Desk Organizers": [
    {
      name: "Bamboo Desk Organizer — 7 Compartments",
      description: "Sustainably sourced bamboo, cable slot in the back, non-slip base.",
      basePrice: "28.99",
      stock: 80,
      images: ["https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&q=80"],
    },
    {
      name: "Magnetic Whiteboard Desk Pad",
      description: "Large 90×45cm, weekly planner layout, included dry-erase markers. Reusable.",
      basePrice: "19.99",
      stock: 95,
      images: ["https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80"],
    },
  ],
  "Decor & Furniture": [
    {
      name: "Minimalist Floating Shelf Set — Oak",
      description: "Solid oak boards, invisible wall brackets, max load 15kg each. Easy install.",
      basePrice: "64.99",
      stock: 40,
      images: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80"],
    },
    {
      name: "Geometric Concrete Planter Set",
      description: "Set of 3 handmade concrete pots. Drainage hole, matching bamboo saucers.",
      basePrice: "31.99",
      stock: 60,
      images: ["https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=800&q=80"],
    },
  ],
  "Fitness Gear & Equipment": [
    {
      name: "Adjustable Dumbbell Set — 5–52.5 lbs",
      description: "15 weight settings, space-saving design, steel plates, ABS housing.",
      basePrice: "299.99",
      stock: 20,
      images: ["https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80"],
    },
    {
      name: "Resistance Bands Set — 5 Levels",
      description: "Natural latex, fabric-covered, door anchor + handle accessories included.",
      basePrice: "24.99",
      stock: 150,
      images: ["https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=800&q=80"],
    },
  ],
  "Outdoor & Camping": [
    {
      name: "3-Season Ultralight Camping Tent",
      description: "Dual-wall design, 1.8kg, 3000mm hydrostatic rating, 2-person capacity.",
      basePrice: "189.00",
      stock: 25,
      images: ["https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80"],
    },
    {
      name: "Stainless Steel Camping Cookset — 6pc",
      description: "Pot, pan, 2 cups, folding handles, carry bag. Campfire & gas stove safe.",
      basePrice: "44.99",
      stock: 45,
      images: ["https://images.unsplash.com/photo-1544476915-ed1370594142?w=800&q=80"],
    },
  ],
  "Skincare & Grooming": [
    {
      name: "Vitamin C Brightening Serum 30ml",
      description: "15% L-ascorbic acid, ferulic acid, hyaluronic acid. Vegan & cruelty-free.",
      basePrice: "34.99",
      stock: 100,
      images: ["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80"],
    },
    {
      name: "Bamboo Charcoal Facial Cleansing Set",
      description: "Deep pore cleanser, exfoliating bamboo pads, reusable cloth. Travel friendly.",
      basePrice: "19.99",
      stock: 120,
      images: ["https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80"],
    },
  ],
  "Travel Accessories": [
    {
      name: "Compression Packing Cubes — Set of 6",
      description: "Compresses clothes to 60%, ripstop nylon, double-zip closure, labelled sizes.",
      basePrice: "32.99",
      stock: 85,
      images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80"],
    },
    {
      name: "Universal Travel Adapter — 4 USB Ports",
      description: "Covers 190+ countries, 65W PD USB-C, surge protection, foldable plugs.",
      basePrice: "27.99",
      stock: 95,
      images: ["https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80"],
    },
  ],
};

const REVIEW_COMMENTS = [
  "Absolutely love this! Exceeded my expectations in every way. Will buy again.",
  "Solid quality for the price. Packaging was great and delivery was fast.",
  "Good product overall. The color was slightly different from the photos but still happy.",
  "Five stars — this is exactly what I needed. Highly recommend to anyone.",
  "Works perfectly. Setup was straightforward and it looks great on my desk.",
  "Great value. Build quality feels premium and it arrived well protected.",
  "Decent product, but took a little longer to arrive than expected.",
  "Really happy with this purchase. The quality is excellent.",
  "Perfect fit and very comfortable. Already ordered a second one for a friend.",
  "Nice product! Not perfect but close to it. Would buy from this store again.",
];

const SELLER_REPLIES = [
  "Thank you so much for your kind review! We're thrilled you're happy with your purchase. 🙌",
  "We really appreciate your feedback! Feel free to reach out if you need any assistance.",
  "Thanks for taking the time to leave a review. Your satisfaction is our top priority!",
  "So glad you love it! We worked hard on this product and it means a lot to hear this.",
  "Thank you! We hope you enjoy it for many years to come. Don't hesitate to contact us.",
];

// ────────────────────────────────────────────────────────────────
//  MAIN
// ────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🌱  Starting full platform seed...\n");

  const hashed = await bcrypt.hash(PASS, 12);

  // ── 1. SUPER ADMIN ───────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: "admin@nextg.com" },
    update: { password: hashed, status: "ACTIVE", role: "SUPER_ADMIN", isEmailVerified: true },
    create: {
      name: "Super Admin",
      email: "admin@nextg.com",
      password: hashed,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      isEmailVerified: true,
      profile: { create: { phone: "+1 555-0100", city: "San Francisco", country: "United States" } },
    },
  });
  console.log("✅ Super Admin:", admin.email);

  // ── 2. SHOP OWNERS & SHOPS ───────────────────────────────────
  const ownerConfigs = [
    {
      email: "seller@nextg.com",
      name: "Alex Vance",
      shopSlug: "nextg-tech-store",
      shopName: "NextG Tech Store",
      shopDesc: "Premium electronics, audio gear, and cutting-edge digital accessories.",
      city: "Seattle",
    },
    {
      email: "seller2@nextg.com",
      name: "Maria Chen",
      shopSlug: "urban-style-hub",
      shopName: "Urban Style Hub",
      shopDesc: "Curated fashion, footwear, and lifestyle essentials for the modern urbanite.",
      city: "New York",
    },
  ];

  const shops: { id: string; ownerId: string; slug: string }[] = [];

  for (const cfg of ownerConfigs) {
    const owner = await prisma.user.upsert({
      where: { email: cfg.email },
      update: { password: hashed, status: "ACTIVE", role: "SHOP_OWNER", isEmailVerified: true },
      create: {
        name: cfg.name,
        email: cfg.email,
        password: hashed,
        role: "SHOP_OWNER",
        status: "ACTIVE",
        isEmailVerified: true,
        profile: { create: { phone: "+1 555-0199", city: cfg.city, country: "United States" } },
      },
    });

    const shop = await prisma.shop.upsert({
      where: { slug: cfg.shopSlug },
      update: { status: "ACTIVE", ownerId: owner.id },
      create: {
        ownerId: owner.id,
        slug: cfg.shopSlug,
        status: "ACTIVE",
        profile: {
          create: {
            name: cfg.shopName,
            description: cfg.shopDesc,
            phone: "+1 555-0199",
            email: `support@${cfg.shopSlug}.com`,
            city: cfg.city,
            country: "United States",
          },
        },
        wallet: { create: { balance: 2500 } },
        legalInfo: {
          create: {
            legalBusinessName: `${cfg.shopName} LLC`,
            taxId: `US-${uid()}`,
            entityType: "LLC",
          },
        },
      },
    });

    shops.push({ id: shop.id, ownerId: owner.id, slug: shop.slug });
    console.log(`✅ Shop Owner: ${owner.email}  →  Shop: ${shop.slug}`);
  }

  // Reset existing dani dev user if present
  const daniUser = await prisma.user.findUnique({ where: { email: "dani21.dev@gmail.com" } });
  if (daniUser) {
    await prisma.user.update({
      where: { id: daniUser.id },
      data: { password: hashed, isEmailVerified: true, status: "ACTIVE" },
    });
    await prisma.shop.updateMany({ where: { ownerId: daniUser.id }, data: { status: "ACTIVE" } });
    console.log("✅ Existing dani21.dev@gmail.com reset & shops activated");
  }

  // ── 3. CUSTOMERS ─────────────────────────────────────────────
  const customerDefs = [
    { email: "customer@nextg.com",  name: "Jordan Smith",   city: "Springfield" },
    { email: "customer2@nextg.com", name: "Emily Davis",    city: "Austin" },
    { email: "customer3@nextg.com", name: "Liam Nguyen",    city: "Chicago" },
    { email: "customer4@nextg.com", name: "Aisha Patel",    city: "Miami" },
  ];

  const customers: { id: string; name: string; email: string }[] = [];

  for (const cd of customerDefs) {
    const c = await prisma.user.upsert({
      where: { email: cd.email },
      update: { password: hashed, status: "ACTIVE", isEmailVerified: true, role: "CUSTOMER" },
      create: {
        name: cd.name,
        email: cd.email,
        password: hashed,
        role: "CUSTOMER",
        status: "ACTIVE",
        isEmailVerified: true,
        profile: { create: { phone: "+1 555-0100", city: cd.city, country: "United States" } },
      },
    });
    customers.push({ id: c.id, name: c.name, email: c.email });
    console.log("✅ Customer:", c.email);
  }

  // ── 4. PLATFORM CATEGORIES ───────────────────────────────────
  const leafCategories: { id: string; name: string }[] = [];

  let parentOrder = 0;
  for (const [parentName, children] of Object.entries(CATEGORY_TREE)) {
    const parent = await prisma.category.upsert({
      where: { slug: slug(parentName) },
      update: { name: parentName, isActive: true, isFeatured: true },
      create: { name: parentName, slug: slug(parentName), isFeatured: true, sortOrder: parentOrder++ },
    });

    let childOrder = 0;
    for (const childName of children) {
      const child = await prisma.category.upsert({
        where: { slug: slug(childName) },
        update: { name: childName, parentId: parent.id, isActive: true },
        create: { name: childName, slug: slug(childName), parentId: parent.id, sortOrder: childOrder++ },
      });
      leafCategories.push({ id: child.id, name: child.name });
    }
  }
  console.log(`✅ ${leafCategories.length} platform categories seeded`);

  // ── 5. PRODUCTS (2 per subcategory, distributed across shops) ─
  const allProducts: { id: string; shopId: string; name: string }[] = [];
  let shopIndex = 0;

  for (const cat of leafCategories) {
    const templates = PRODUCTS_BY_CATEGORY[cat.name] ?? [];
    if (templates.length === 0) continue;

    for (const tmpl of templates) {
      const shop = shops[shopIndex % shops.length]!;
      shopIndex++;

      const productSlug = `${slug(tmpl.name)}-${uid()}`;
      const productSku = `SKU-${uid().toUpperCase()}`;

      // Check if product already exists for this shop with similar slug prefix
      const existing = await prisma.product.findFirst({
        where: { shopId: shop.id, name: tmpl.name },
        select: { id: true },
      });

      let productId: string;

      if (existing) {
        productId = existing.id;
        await prisma.product.update({
          where: { id: existing.id },
          data: { status: "ACTIVE", stock: tmpl.stock, platformCategoryId: cat.id },
        });
      } else {
        const created = await prisma.product.create({
          data: {
            shopId: shop.id,
            platformCategoryId: cat.id,
            name: tmpl.name,
            slug: productSlug,
            sku: productSku,
            description: tmpl.description,
            basePrice: tmpl.basePrice,
            stock: tmpl.stock,
            type: "PHYSICAL",
            status: "ACTIVE",
            images: {
              create: tmpl.images.map((url, i) => ({ url, isPrimary: i === 0 })),
            },
            ...(tmpl.variants && tmpl.variants.length > 0
              ? {
                  variants: {
                    create: tmpl.variants.map((v, i) => ({
                      name: v.name,
                      price: v.price,
                      stock: v.stock,
                      sku: `${productSku}-V${i + 1}`,
                    })),
                  },
                }
              : {}),
          },
        });
        productId = created.id;
      }

      allProducts.push({ id: productId, shopId: shop.id, name: tmpl.name });
    }
  }
  console.log(`✅ ${allProducts.length} products seeded across ${shops.length} shops`);

  // ── 6. DELIVERED ORDERS — every customer × every product ────
  //  (This unlocks the review gate: "must have a DELIVERED order")
  console.log("\n📦  Creating DELIVERED orders...");

  const orderIdempotencySet = new Set<string>();
  const checkoutIdempotencySet = new Set<string>();

  for (const customer of customers) {
    // Group products into batches of up to 5 per checkout (realistic)
    const BATCH = 5;
    const batches: typeof allProducts[] = [];
    for (let i = 0; i < allProducts.length; i += BATCH) {
      batches.push(allProducts.slice(i, i + BATCH));
    }

    for (const batch of batches) {
      // Each batch may span multiple shops — create one checkout, one order per shop
      const byShop = new Map<string, typeof allProducts>();
      for (const p of batch) {
        if (!byShop.has(p.shopId)) byShop.set(p.shopId, []);
        byShop.get(p.shopId)!.push(p);
      }

      // One checkout per batch
      let checkoutKey = `chk-${customer.id}-${uid()}`;
      while (checkoutIdempotencySet.has(checkoutKey)) checkoutKey = `chk-${customer.id}-${uid()}`;
      checkoutIdempotencySet.add(checkoutKey);

      const batchTotal = batch.reduce((s, p) => {
        const tmpl = PRODUCTS_BY_CATEGORY[
          allProducts.find((ap) => ap.id === p.id)
            ? leafCategories.find(
                (lc) => PRODUCTS_BY_CATEGORY[lc.name]?.some((t) => t.name === p.name)
              )?.name ?? ""
            : ""
        ]?.find((t) => t.name === p.name);
        return s + Number(tmpl?.basePrice ?? "25.00");
      }, 0);

      const checkout = await prisma.checkout.create({
        data: {
          customerId: customer.id,
          totalAmount: batchTotal || 99.99,
          status: "COMPLETED",
          idempotencyKey: checkoutKey,
        },
      });

      for (const [shopId, products] of byShop.entries()) {
        const shopTotal = products.reduce((s, p) => {
          const tmpl = PRODUCTS_BY_CATEGORY[
            leafCategories.find(
              (lc) => PRODUCTS_BY_CATEGORY[lc.name]?.some((t) => t.name === p.name)
            )?.name ?? ""
          ]?.find((t) => t.name === p.name);
          return s + Number(tmpl?.basePrice ?? "25.00");
        }, 0);

        let orderKey = `ord-${customer.id}-${shopId}-${uid()}`;
        while (orderIdempotencySet.has(orderKey)) orderKey = `ord-${customer.id}-${shopId}-${uid()}`;
        orderIdempotencySet.add(orderKey);

        await prisma.order.create({
          data: {
            checkoutId: checkout.id,
            shopId,
            customerId: customer.id,
            status: "DELIVERED",
            totalAmount: shopTotal || 49.99,
            idempotencyKey: orderKey,
            shippingAddress: {
              create: {
                fullName: customer.name,
                phone: "+1 555-0100",
                address: "742 Evergreen Terrace",
                city: "Springfield",
                country: "United States",
                postalCode: "90210",
              },
            },
            items: {
              create: products.map((p) => {
                const tmpl = PRODUCTS_BY_CATEGORY[
                  leafCategories.find(
                    (lc) => PRODUCTS_BY_CATEGORY[lc.name]?.some((t) => t.name === p.name)
                  )?.name ?? ""
                ]?.find((t) => t.name === p.name);
                return {
                  productId: p.id,
                  quantity: 1,
                  unitPrice: tmpl?.basePrice ?? "25.00",
                };
              }),
            },
          },
        });
      }
    }
  }
  console.log(`✅ Delivered orders created for all ${customers.length} customers`);

  // ── 7. REVIEWS (3–4 per product) + SELLER REPLIES ───────────
  console.log("\n⭐  Seeding reviews...");

  let totalReviews = 0;
  let totalReplies = 0;

  for (const product of allProducts) {
    // Pick 3 customers to leave a review (shuffle)
    const reviewers = [...customers].sort(() => Math.random() - 0.5).slice(0, 3);

    for (let i = 0; i < reviewers.length; i++) {
      const customer = reviewers[i]!;

      // Check if review already exists
      const existing = await prisma.review.findUnique({
        where: { productId_userId: { productId: product.id, userId: customer.id } },
        select: { id: true },
      });

      if (existing) continue;

      const rating = randomInt(3, 5); // mostly positive reviews
      const comment = pickRandom(REVIEW_COMMENTS);

      const review = await prisma.review.create({
        data: {
          productId: product.id,
          userId: customer.id,
          shopId: product.shopId,
          rating,
          comment,
          isVisible: true,
        },
      });
      totalReviews++;

      // Seller replies on ~every other review
      if (i % 2 === 0) {
        await prisma.reviewReply.upsert({
          where: { reviewId: review.id },
          update: { comment: pickRandom(SELLER_REPLIES) },
          create: { reviewId: review.id, comment: pickRandom(SELLER_REPLIES) },
        });
        totalReplies++;
      }
    }
  }
  console.log(`✅ ${totalReviews} reviews seeded, ${totalReplies} seller replies added`);

  // ── 8. WISHLIST ITEMS ────────────────────────────────────────
  console.log("\n💾  Seeding wishlists...");

  for (const customer of customers) {
    const picks = [...allProducts].sort(() => Math.random() - 0.5).slice(0, 6);
    for (const p of picks) {
      await prisma.wishlistItem.upsert({
        where: { userId_productId: { userId: customer.id, productId: p.id } },
        update: {},
        create: { userId: customer.id, productId: p.id },
      });
    }
  }
  console.log(`✅ Wishlists seeded for all ${customers.length} customers`);

  // ── SUMMARY ──────────────────────────────────────────────────
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║   🎉  FULL SEED COMPLETE — ALL DATA READY TO TEST    ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");
  console.log("  Common password:  Password123!\n");
  console.log("  ┌─────────────────────────────────────────────────┐");
  console.log("  │  ROLE         │  EMAIL                          │");
  console.log("  ├─────────────────────────────────────────────────┤");
  console.log("  │  SUPER ADMIN  │  admin@nextg.com                │");
  console.log("  │  SHOP OWNER 1 │  seller@nextg.com               │");
  console.log("  │  SHOP OWNER 2 │  seller2@nextg.com              │");
  console.log("  │  CUSTOMER 1   │  customer@nextg.com             │");
  console.log("  │  CUSTOMER 2   │  customer2@nextg.com            │");
  console.log("  │  CUSTOMER 3   │  customer3@nextg.com            │");
  console.log("  │  CUSTOMER 4   │  customer4@nextg.com            │");
  console.log("  └─────────────────────────────────────────────────┘\n");
  console.log("  What's ready:");
  console.log(`    • ${leafCategories.length} platform categories (4 parents → 18 subcategories)`);
  console.log(`    • ${allProducts.length} ACTIVE products spread across 2 shops`);
  console.log("    • Every customer has a DELIVERED order for every product");
  console.log(`    • ${totalReviews} customer reviews (ratings 3–5 ⭐)`);
  console.log(`    • ${totalReplies} seller replies`);
  console.log("    • Wishlist items per customer\n");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("\n❌  Seed failed:", err);
  process.exit(1);
});
