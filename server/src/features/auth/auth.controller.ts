import { asyncHandler } from "../../utils/asyncHandler.js";
import { Request, Response } from "express";
import { registerService } from "./auth.services.js";

export const registerController = asyncHandler(async (req: Request, res: Response) => {

  const response = await registerService(req.body);

  res.status(201).json({
    success: true,
    statusCode: 201,
    message: "User registered successfully",
    data: response                         
  });

});