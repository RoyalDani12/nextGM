import { asyncHandler } from "../../utils/asyncHandler.js";
import { Request, Response } from "express";

import { loginService,
        registerService,
        verifyEmailService, 
        refreshTokenService,
        logoutService,
        resendVerificationService,
        forgotPasswordService,  
        resetPasswordService
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
      const result = await loginService({ password,email})
      
      const SEVEN_DAYS =7 * 24 * 60 * 60 * 1000

      // detect deactivation response
      if("code" in result && result.code ==="ACCOUNT_DEACTIVATED"){
        res.status(200).json({
          success:true,
          statusCode:200,
          message:result.message,
          reactivationKey:result.reactivationKey
        })

        return
      }
      // save refresh token to cookie
      res.cookie("refreshToken",result.refreshToken,{
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
          accessToken:result.accessToken,
          user:result.user
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



// logout controller
export const logoutController = asyncHandler( async(req:Request,res:Response)=>{
     
  
  const token = req.cookies.refreshToken
  const userId  = req.user!.id

  // if no cookie user is already logout still return 200
  if( token ){
     await logoutService(userId,token)
  }
    
  // clear cookie 
  res.clearCookie("refreshToken",{
    httpOnly:true,
    secure:env.NODE_ENV ==="production",
    sameSite:"strict"
  })

  res.status(200).json({
    success:true,
    statusCode:200,
    message:"Logged out successfully."
  })

})


// resend verification controller
export const resendVerificationController= asyncHandler( async(req:Request,res:Response)=>{
  const { email } = req.body
  if(!email){
    throw new AppError("No email provided.",400)
  }

   const result = await resendVerificationService(email) 


  res.status(200).json({
    success:true,
    statusCode:200,
    message:result.message
  })
})


// forget password  controller

export const forgotPasswordController = asyncHandler(  async(req:Request,res:Response)=>{

  // extract email form the request

  const { email }  = req.body

   const result = await  forgotPasswordService(email)

   res.status(200).json({
    success:true,
    statusCode:200,
    message:result.message
   })

})

// reset password controller

export const resetPasswordController = asyncHandler( async(req:Request,res:Response)=>{
   const { newPassword ,token } = req.body
   
   const result = await resetPasswordService(token,newPassword)

   res.clearCookie("refreshToken",{
    httpOnly:true,
    sameSite:"strict",
    secure:env.NODE_ENV === "production"
   })

   res.status(200).json({
    success:true,
    statusCode:200,
    message:result.message
   })
})