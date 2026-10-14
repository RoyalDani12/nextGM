import "dotenv/config";
import { prisma } from "../config/db.js";
import slugify from "slugify";

const hierarchy = {
  "APPAREL & STYLE": ["Men's & Women's Wear", "Footwear & Sneakers", "Bags & Leather Goods", "Custom Merchandise", "Watches & Jewelry"],
  "TECH & ELECTRONICS": ["Smartphones & Accessories", "Audio & Headphones", "Power Banks & Chargers", "Smart Home Hardware", "Cable Management"],
  "HOME & WORKSPACE": ["Ergonomic Desk Setup", "Mechanical Keyboards", "Office & Ambient Lighting", "Desk Organizers", "Decor & Furniture"],
  "SPORTS & PERSONAL CARE": ["Fitness Gear & Equipment", "Outdoor & Camping", "Skincare & Grooming", "Travel Accessories"],
};
const slug = (name: string) => slugify(name, { lower: true, strict: true });
async function main() {
  const leaves: { id: string; name: string }[] = [];
  for (const [name, children] of Object.entries(hierarchy)) {
    const parent = await prisma.category.upsert({ where: { slug: slug(name) }, update: { name, isActive: true }, create: { name, slug: slug(name), isFeatured: true, sortOrder: Object.keys(hierarchy).indexOf(name) } });
    for (const [index, child] of children.entries()) {
      const category = await prisma.category.upsert({ where: { slug: slug(child) }, update: { name: child, parentId: parent.id, isActive: true }, create: { name: child, slug: slug(child), parentId: parent.id, sortOrder: index } });
      leaves.push(category);
    }
  }
  const products = await prisma.product.findMany({ where: { status: "ACTIVE", platformCategoryId: null }, select: { id: true, name: true } });
  await Promise.all(products.map((product, index) => prisma.product.update({ where: { id: product.id }, data: { platformCategoryId: leaves[index % leaves.length]?.id } })));
  console.log(`Seeded ${leaves.length} subcategories and assigned ${products.length} active products.`);
}
main().finally(() => prisma.$disconnect());
