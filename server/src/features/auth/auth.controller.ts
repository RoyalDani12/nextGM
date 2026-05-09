import { asyncHandler } from "../../utils/asyncHandler.js";
import { Request, Response } from "express";

import { loginService,
        registerService,
        verifyEmailService, 
        refreshTokenService
  } from "./auth.services.js";

import { env } from "../../config/env.js";
import { AppError } from "../../middleware/appError.js";

export const registerController = asyncHandler(async (req: Request, res: Response) => {

   const { name, email, password } = req.body; 

  const { user } = await registerService({ name, email, password });

  res.status(201).json({
    success: true,
    statusCode: 201,
    message: "Registration successful. Please check your email to verify your account.",
    data: { user }                        
  });

});


// verify email controller
export const verifyEmailController = asyncHandler(async(req:Request,res:Response)=>{

   const { token } = req.query as { token :string}
  const response = await verifyEmailService(token)

  res.status(200).json({
    success:true,
    statusCode:200,
    message:"Email verify Successfully",
    response
  })

})


// login controller

export const loginController = asyncHandler( async(req:Request,res:Response)=>{
      const { password,email } = req.body
      const response = await loginService({ password,email})
      
      const SEVEN_DAYS =7 * 24 * 60 * 60 * 1000
      // save refresh token to cookie
      res.cookie("refreshToken",response.refreshToken,{
        httpOnly:true,
        secure:env.NODE_ENV === "production",
        sameSite:"strict",
        maxAge:SEVEN_DAYS
      })

      res.status(200).json({
        statusCode:200,
        success:true,
        message:"User Login Successfully",
        data:{
          accessToken:response.accessToken,
          user:response.user
        }
      })
})

//  refresh token controller

export const refreshTokenController = asyncHandler( async (req:Request,res:Response)=>{
    
  const SEVEN_DAYS =7 * 24 * 60 * 60 * 1000
  const token   = req.cookies.refreshToken
    if(!token){
      throw new AppError("No refresh token provided.",401)
    }
   const { refreshToken,accessToken} = await refreshTokenService(token)

   // again put the token in the cookie
   res.cookie("refreshToken",refreshToken,{
    httpOnly:true,
    secure:env.NODE_ENV ==="production",
    sameSite:"strict",
    maxAge:SEVEN_DAYS
   })

   res.status(200).json({
    success:true,
    statusCode:200,
    message:"Token refreshed successfully",
    data: { accessToken }
   })
})