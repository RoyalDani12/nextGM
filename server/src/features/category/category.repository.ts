import { prisma } from "../../config/db.js";

const categorySelect = {
  id: true, name: true, slug: true, parentId: true, description: true, icon: true, imageUrl: true,
  isActive: true, isFeatured: true, sortOrder: true, createdAt: true,
  _count: { select: { products: { where: { status: "ACTIVE", deletedAt: null } } } },
} as const;

export const listCategories = (includeInactive = false) => prisma.category.findMany({
  where: includeInactive ? {} : { isActive: true }, select: categorySelect, orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
});
export const findCategory = (id: string) => prisma.category.findUnique({ where: { id }, select: categorySelect });
export const createCategory = (data: any) => prisma.category.create({ data, select: categorySelect });
export const updateCategory = (id: string, data: any) => prisma.category.update({ where: { id }, data, select: categorySelect });
export const categoryUsage = (id: string) => Promise.all([
  prisma.category.count({ where: { parentId: id } }),
  prisma.product.count({ where: { platformCategoryId: id } }),
]);
export const removeCategory = (id: string) => prisma.category.delete({ where: { id } });
