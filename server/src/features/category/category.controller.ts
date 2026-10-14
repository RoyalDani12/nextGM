import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as service from "./category.service.js";
const respond = (res: Response, data: unknown, message = "Categories fetched successfully.", status = 200) => res.status(status).json({ success: true, statusCode: status, message, data });
export const tree = asyncHandler(async (_req: Request, res: Response) => respond(res, await service.getCategoryTree()));
export const flat = asyncHandler(async (req: Request, res: Response) => respond(res, await service.getFlatCategories(req.user?.role === "SUPER_ADMIN" && req.query.includeInactive === "true")));
export const create = asyncHandler(async (req: Request, res: Response) => respond(res, await service.createCategory(req.body), "Category created successfully.", 201));
export const update = asyncHandler(async (req: Request, res: Response) => respond(res, await service.editCategory(req.params.id as string, req.body), "Category updated successfully."));
export const remove = asyncHandler(async (req: Request, res: Response) => { await service.deleteCategory(req.params.id as string); respond(res, null, "Category deleted successfully."); });
