import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../middleware/appError.js";
import {
  cancelCustomerReturnService,
  createReturnRequestService,
  getCustomerReturnByIdService,
  getCustomerReturnsService,
  updateCustomerReturnEvidenceService,
  getShopReturnByIdService,
  getShopReturnsService,
  updateShopReturnStatusService,
} from "./return.service.js";

const customerId = (req: Request) => {
  if (!req.user?.id) throw new AppError("Unauthorized.", 401);
  return req.user.id;
};

export const createReturnController = asyncHandler(async (req: Request, res: Response) => {
  const result = await createReturnRequestService(customerId(req), req.body);
  res.status(201).json({ success: true, message: "Return request submitted.", data: result });
});

export const getCustomerReturnsController = asyncHandler(async (req: Request, res: Response) => {
  const result = await getCustomerReturnsService(customerId(req));
  res.json({ success: true, data: result });
});

export const getCustomerReturnByIdController = asyncHandler(async (req: Request, res: Response) => {
  const result = await getCustomerReturnByIdService(customerId(req), req.params.returnId as string);
  res.json({ success: true, data: result });
});

export const cancelCustomerReturnController = asyncHandler(async (req: Request, res: Response) => {
  const result = await cancelCustomerReturnService(customerId(req), req.params.returnId as string);
  res.json({ success: true, message: "Return request cancelled.", data: result });
});

export const updateCustomerReturnEvidenceController = asyncHandler(async (req: Request, res: Response) => {
  const result = await updateCustomerReturnEvidenceService(
    customerId(req),
    req.params.returnId as string,
    req.body.evidenceUrls,
  );
  res.json({ success: true, message: "Return evidence updated.", data: result });
});

export const getShopReturnsController = asyncHandler(async (req: Request, res: Response) => {
  const result = await getShopReturnsService(req.params.shopId as string, req.query as never);
  res.json({ success: true, data: result });
});

export const getShopReturnByIdController = asyncHandler(async (req: Request, res: Response) => {
  const result = await getShopReturnByIdService(req.params.shopId as string, req.params.returnId as string);
  res.json({ success: true, data: result });
});

export const updateShopReturnStatusController = asyncHandler(async (req: Request, res: Response) => {
  const result = await updateShopReturnStatusService(
    req.params.shopId as string,
    req.params.returnId as string,
    req.body.status,
    req.body.note,
  );
  res.json({ success: true, message: "Return status updated.", data: result });
});
