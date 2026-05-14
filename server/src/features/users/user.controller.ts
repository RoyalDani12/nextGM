import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { generateAvatarUploadSignatureService, getMeService, updateUserProfileService } from "./user.service.js";
import { AppError } from "../../middleware/appError.js";

export const getMeController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
     if(!userId){
      throw new AppError("Unauthorized access denied!",403)
     }

    const result = await getMeService(userId);

    res.status(200).json({
        success: true,
        statusCode: 200,
        message:"User Data Fetch Successfully.",
        data: result,
    });
});

  // get signature controller
export const getUploadSignatureController = asyncHandler( async (req:Request,res:Response)=>{
    const result  = await generateAvatarUploadSignatureService()

    res.status(200).json({
      success:true,
      statusCode:200,
      message:"Upload signature generator successfully.",
      data:result
    })
})


// upload profile signature

export const updateUserProfileController = asyncHandler ( async (req:Request,res:Response)=>{
   
  const userId = req.user?.id
  if( !userId){
    throw new AppError("Unauthorized access denied !",403)
  }
  

  const result = await updateUserProfileService(userId,req.body)

  res.status(200).json({
    success:true,
    statusCode:200,
    message:"Profile updated Successfully.",
    data:result
  })
})