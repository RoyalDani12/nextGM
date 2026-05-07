import { LoginDto, RegisterDto } from "./auth.types.js";
import { AppError } from "../../middleware/appError.js";
import {
    findUserByEmail,
    createUserWithVerification,
    findEmailVerification,
    markEmailVerified,
    saveRefreshTokenAndUpdateLastLogin,
} from "./auth.repository.js";
import { hashPassword, verifyPassword } from "../../utils/auth.utils.js";
import { emailQueue } from "../../infrastructure/queue/queue.client.js";
import { verificationEmailTemplate } from "../../services/email.templates.js";
import { generateAccessToken,generateRefreshToken } from "./token.service.js";
import crypto from "crypto";
import { cacheUserSession } from "../../infrastructure/cache/session.cache.js";





export const registerService = async (userData: RegisterDto) => {

    
    const existingUser = await findUserByEmail(userData.email);
    if (existingUser) {
        throw new AppError(" Email already in use ", 409);
    }

    // hash password
    const hashedPassword: string = await hashPassword(userData.password);

    // create user + verification token
    const { user, rawToken } = await createUserWithVerification({
        ...userData,
        hashedPassword,
    });

    // get email templates
    const { subject, html } = verificationEmailTemplate(user.name, rawToken);


    // push  email  to job queue
    await emailQueue.add("verify-email", {
        to: user.email,
        subject,
        html,
    });

    return { user };
};




// verify  email service
export const verifyEmailService = async (token: string) => {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // find the verification record
    const verification = await findEmailVerification(hashedToken);

    if (!verification) {
        throw new AppError("Invalid or Expired verification link", 400);
    }

    // check expiry
    if (verification.expiresAt < new Date()) {
        throw new AppError("Verification link has expired. Please request a new one.", 400);
    }

    // check if already verified
    if (verification.user.isEmailVerified) {
        throw new AppError("Email is already verified.", 400);
    }

    // mark verified and burn the token
    await markEmailVerified(verification.userId, verification.id);

    return {
        message: "Email verified successfully. You can now log in.",
    };
};



// login service
export const loginService = async(userData:LoginDto)=>{
    // check the email is register and verified
    const user= await  findUserByEmail(userData.email)

    if(!user){
        throw new AppError("Invalid password or Email",401)
    }

    // check the email is verified or not 

if(!user.isEmailVerified){
    throw new AppError ("Please verify your email before logging in.", 403)
}
  
if (user.status !=="ACTIVE"){
    throw new AppError ("Your account has been Suspended",403)
}   
  // compare password

  const isPasswordValid = await verifyPassword(userData.password,user.password)

  if(!isPasswordValid){
    throw new AppError ("Invalid Email or Password",401)
  }

  // generate token
  const accessToken = generateAccessToken(user.id,user.role)

  const refreshToken = generateRefreshToken(user.id)

  // hash the refresh token
   const refreshHashedToken = crypto
   .createHash("sha256")
   .update(refreshToken)
   .digest("hex")


// save to the refresh token  and last login at
await saveRefreshTokenAndUpdateLastLogin(user.id,refreshHashedToken)


   // cache session in redis

   await cacheUserSession({
    id:user.id,
    name:user.name,
    email:user.email,
    role:user.role,
    status:user.status
   })

return {
    accessToken,
    refreshToken,
    user:{
        id:user.id,
        name:user.name,
        email:user.email,
        role:user.role
    }
}

}
