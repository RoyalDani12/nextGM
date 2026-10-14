import { AppError } from "../../middleware/appError.js";
import { generateUniqueSlug } from "../../utils/generateSlug.js";
import * as repository from "./category.repository.js";

const toTree = (categories: any[]) => {
  const byId = new Map(categories.map((category) => [category.id, { ...category, productCount: category._count.products, children: [] as any[] }]));
  const roots: any[] = [];
  for (const category of byId.values()) {
    if (category.parentId && byId.has(category.parentId)) byId.get(category.parentId).children.push(category);
    else roots.push(category);
  }
  return roots;
};

export const getCategoryTree = async () => toTree(await repository.listCategories());
export const getFlatCategories = async (includeInactive = false) => {
  const categories = await repository.listCategories(includeInactive);
  const byId = new Map(categories.map((category) => [category.id, category]));
  return categories.map((category) => {
    const parts = [category.name]; let current = category;
    while (current.parentId && byId.has(current.parentId)) { current = byId.get(current.parentId)!; parts.unshift(current.name); }
    return { ...category, productCount: category._count.products, path: parts.join(" > ") };
  });
};
export const createCategory = async (body: any) => {
  if (body.parentId && !await repository.findCategory(body.parentId)) throw new AppError("Parent category not found.", 404);
  const slug = body.slug || await generateUniqueSlug(body.name, async (candidate) => Boolean(await repository.listCategories(true).then((items) => items.find((item) => item.slug === candidate))));
  return repository.createCategory({ ...body, slug });
};
export const editCategory = async (id: string, body: any) => {
  const existing = await repository.findCategory(id); if (!existing) throw new AppError("Category not found.", 404);
  if (body.parentId === id) throw new AppError("A category cannot be its own parent.", 400);
  if (body.parentId && !await repository.findCategory(body.parentId)) throw new AppError("Parent category not found.", 404);
  return repository.updateCategory(id, body);
};
export const deleteCategory = async (id: string) => {
  const existing = await repository.findCategory(id); if (!existing) throw new AppError("Category not found.", 404);
  const [children, products] = await repository.categoryUsage(id);
  if (children || products) throw new AppError("Reassign child categories and products before deleting this category.", 409);
  await repository.removeCategory(id);
};
