import { asyncHandler } from "../../utils/asyncHandler.js";
import { Request, Response } from "express";
import { parseDeviceName } from "../../utils/parseDevice.js";
import { loginService,
        registerService,
        verifyEmailService, 
        refreshTokenService,
        logoutService,
        resendVerificationService,
        forgotPasswordService,  
        resetPasswordService,
        googleLoginService
  } from "./auth.services.js";

import { env } from "../../config/env.js";
import { AppError } from "../../middleware/appError.js";
import crypto from "crypto";
import { findRefreshToken, deleteRefreshToken } from "./auth.repository.js";
import { verifyAccessToken } from "./token.service.js";
import { deleteUserSession } from "../../infrastructure/cache/session.cache.js";
import { AccessTokenPayload } from "../../types/auth.types.js";
import { reactivateAccountService } from "../users/user.service.js";
import {
  createAuthTicket,
  consumeAuthTicket,
  generateOAuthState,
  verifyOAuthState,
} from "./auth.ticket.js";

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
      const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown'
      const userAgent = req.headers['user-agent'] ??''
      const device    = parseDeviceName(userAgent)

   const result = await loginService(
            { password, email },
            {
                ipAddress:  ip,
                userAgent:  userAgent,
                deviceName: device,
            }
        )
      
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
      const isProduction = env.NODE_ENV === "production";
      res.cookie("refreshToken",result.refreshToken,{
        httpOnly:true,
        secure:isProduction,
        sameSite:isProduction ? "none" : "lax",
        path:"/",
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
   const isProduction = env.NODE_ENV === "production";
   res.cookie("refreshToken",refreshToken,{
    httpOnly:true,
    secure:isProduction,
    sameSite:isProduction ? "none" : "lax",
    path:"/",
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
export const logoutController = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  let userId = req.user?.id;

  if (!userId && req.headers.authorization?.startsWith("Bearer ")) {
    try {
      const accessToken = req.headers.authorization.split(" ")[1];
      if (accessToken) {
        const decoded = verifyAccessToken(accessToken) as AccessTokenPayload | null;
        if (decoded?.userId) {
          userId = decoded.userId;
        }
      }
    } catch {
      // Ignored for logout — expired/invalid access tokens should still allow session termination
    }
  }

  if (token) {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    if (!userId) {
      const existingToken = await findRefreshToken(hashedToken);
      if (existingToken) {
        userId = existingToken.userId;
      }
    }
    if (userId) {
      await logoutService(userId, token);
    } else {
      await deleteRefreshToken(hashedToken);
    }
  } else if (userId) {
    await deleteUserSession(userId);
  }

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: "Logged out successfully.",
  });
});


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

export const reactivateAccountController = asyncHandler(async (req: Request, res: Response) => {
  const { reactivationKey } = req.body;
  const result = await reactivateAccountService(reactivationKey);

  res.cookie("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: result.message,
    data: {
      accessToken: result.accessToken,
      user: result.user,
    },
  });
});

export const googleAuthController = asyncHandler(async (_req: Request, res: Response) => {
  const state = generateOAuthState(env.JWT_SECRET);
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    state,
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

export const googleCallbackController = asyncHandler(async (req: Request, res: Response) => {
  const { code, state, error } = req.query as { code?: string; state?: string; error?: string };
  const fail = (reason: string) => res.redirect(`${env.CLIENT_URL}/login?googleError=${encodeURIComponent(reason)}`);
  
  if (error) {
    return fail("Google sign-in was cancelled by user.");
  }
  
  if (!code || !state || !verifyOAuthState(state, env.JWT_SECRET)) {
    return fail("Google sign-in session expired or was invalid. Please try again.");
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) return fail("Google could not complete the sign-in.");
  const tokens = await tokenResponse.json() as { access_token?: string };
  if (!tokens.access_token) return fail("Google did not return an access token.");

  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const profile = await profileResponse.json() as { email?: string; name?: string; email_verified?: boolean };
  if (!profileResponse.ok || !profile.email || !profile.email_verified) {
    return fail("A verified Google email address is required.");
  }

  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
  const result = await googleLoginService(
    { email: profile.email, name: profile.name ?? "Google user" },
    { ipAddress: ip, userAgent: req.headers["user-agent"] ?? "", deviceName: parseDeviceName(req.headers["user-agent"] ?? "") }
  );

  // Issue single-use exchange ticket
  const ticket = await createAuthTicket({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    user: result.user,
  });

  const isProduction = env.NODE_ENV === "production";
  res.cookie("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // Redirect to frontend auth callback handler with the single-use ticket
  res.redirect(`${env.CLIENT_URL}/auth/callback?ticket=${encodeURIComponent(ticket)}`);
});

export const exchangeTicketController = asyncHandler(async (req: Request, res: Response) => {
  const { ticket } = req.body as { ticket?: string };
  if (!ticket) {
    throw new AppError("Authentication ticket is required", 400);
  }

  const payload = await consumeAuthTicket(ticket);
  if (!payload) {
    throw new AppError("Authentication ticket expired or invalid. Please sign in again.", 401);
  }

  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  const isProduction = env.NODE_ENV === "production";

  res.cookie("refreshToken", payload.refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: SEVEN_DAYS,
  });

  res.status(200).json({
    statusCode: 200,
    success: true,
    message: "Google Sign-In completed successfully",
    data: {
      accessToken: payload.accessToken,
      user: payload.user,
    },
  });
});
