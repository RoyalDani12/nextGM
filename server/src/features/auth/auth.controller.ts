import { asyncHandler } from "../../utils/asyncHandler.js";
import { Request, Response } from "express";
import { registerService } from "./auth.services.js";

export const registerController = asyncHandler(async (req: Request, res: Response) => {

   const { name, email, password } = req.body; 

  const response = await registerService({ name, email, password });

  res.status(201).json({
    success: true,
    statusCode: 201,
    message: "User registered successfully. please verify you email.",
    data: response                         
  });

});