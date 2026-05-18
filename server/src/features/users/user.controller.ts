import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
    changePasswordService,
    deactivateAccountService,
    generateAvatarUploadSignatureService,
    getMeService,
    updateUserProfileService,
} from "./user.service.js";
import { AppError } from "../../middleware/appError.js";
import { env } from "../../config/env.js";
export const getMeController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AppError("Unauthorized access denied!", 403);
    }

    const result = await getMeService(userId);

    res.status(200).json({
        success: true,
        statusCode: 200,
        message: "User Data Fetch Successfully.",
        data: result,
    });
});

// get signature controller
export const getUploadSignatureController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await generateAvatarUploadSignatureService(userId);

    res.status(200).json({
        success: true,
        statusCode: 200,
        message: "Upload signature generator successfully.",
        data: result,
    });
});

// upload profile signature
export const updateUserProfileController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AppError("Unauthorized access denied !", 403);
    }

    const result = await updateUserProfileService(userId, req.body);

    res.status(200).json({
        success: true,
        statusCode: 200,
        message: "Profile updated Successfully.",
        data: result,
    });
});

// change password controller
export const changePasswordController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await changePasswordService(userId, req.body);

    // clear cookie and logout all device
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
    });
    res.status(200).json({
        success: true,
        statusCode: 200,
        message: result.message,
    });
});

// deactivate Account Controller
export const deactivateAccountController = asyncHandler( async(req:Request,res:Response)=>{
    
    const userId = req.user!.id
    const password = req.body.password

 const result = await deactivateAccountService(userId,password)
    
   // clear cookie and force logout
   res.clearCookie("refreshToken",{
    httpOnly:true,
    sameSite:"strict",
    secure:env.NODE_ENV ==="production"
   })
   res.status(200).json({
    success:true,
    statusCode:200,
    message:result.message
   })
})
