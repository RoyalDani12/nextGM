import { LoginDto, RegisterDto } from "./auth.types.js";
import { AppError } from "../../middleware/appError.js";
import {
    findUserByEmail,
    createUserWithVerification,
    findEmailVerification,
    markEmailVerified,
    saveRefreshTokenAndUpdateLastLogin,
    findRefreshToken,
    rotateRefreshToken,
} from "./auth.repository.js";
import { hashPassword, verifyPassword } from "../../utils/auth.utils.js";
import { emailQueue } from "../../infrastructure/queue/queue.client.js";
import { verificationEmailTemplate } from "../../services/email.templates.js";
import { generateAccessToken, generateRefreshToken } from "./token.service.js";
import crypto from "crypto";
import { cacheUserSession, getUserSession } from "../../infrastructure/cache/session.cache.js";

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
export const loginService = async (userData: LoginDto) => {

    const user = await findUserByEmail(userData.email);

    if (!user) {
        throw new AppError("Invalid password or Email", 401);
    }

    // check the email is verified or not

    if (!user.isEmailVerified) {
        throw new AppError("Please verify your email before logging in.", 403);
    }

    if (user.status !== "ACTIVE") {
        throw new AppError("Your account has been Suspended", 403);
    }
    // compare password

    const isPasswordValid = await verifyPassword(userData.password, user.password);

    if (!isPasswordValid) {
        throw new AppError("Invalid Email or Password", 401);
    }

    
    const accessToken = generateAccessToken(user.id, user.role);

    const refreshToken = generateRefreshToken(user.id);

    
    const refreshHashedToken = crypto.createHash("sha256").update(refreshToken).digest("hex");

    // save to the refresh token  and last login at
    await saveRefreshTokenAndUpdateLastLogin(user.id, refreshHashedToken);

    // cache session in redis

    await cacheUserSession({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
    });

    return {
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
    };
};

// refresh token service

export const refreshTokenService = async (token: string) => {
    
    const hashRefresh = crypto.createHash("sha256").update(token).digest("hex");

    // check the database
    const existingToken = await findRefreshToken(hashRefresh);

    if (!existingToken) {
        throw new AppError("Invalid or expired Token.", 401);
    }

    if (existingToken.expiresAt < new Date()) {
        throw new AppError("Refresh token has expired. Please login again.", 401);
    }

    //get user from redis
    let user = await getUserSession(existingToken.userId);

    if (!user) {
        const dbUser = await findUserByEmail(existingToken.userId);
        if (!dbUser) {
            throw new AppError("User not found.", 401);
        }
        await cacheUserSession(dbUser);
        user = dbUser;
    }

    
    if (user.status !== "ACTIVE") {
        throw new AppError("Account suspended", 403);
    }

    // generate new token
    const newAccessToken = generateAccessToken(user.id, user.role);
    const newRefreshToken = generateRefreshToken(user.id);

    const newHashedToken = crypto.createHash("sha256").update(newRefreshToken).digest("hex");

    
    await rotateRefreshToken(existingToken.id, existingToken.userId, newHashedToken);

    await cacheUserSession({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
    });
    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
    };
};
