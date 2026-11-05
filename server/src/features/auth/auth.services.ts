import { recordAuditLog } from '../admin/audit.service.js';
import { LoginDto, RegisterDto,DeviceInfo } from "./auth.types.js";
import { AppError } from "../../middleware/appError.js";
import {
    findUserByEmail,
    createUserWithVerification,
    findEmailVerification,
    markEmailVerified,
    saveRefreshTokenAndUpdateLastLogin,
    findRefreshToken,
    rotateRefreshToken,
    deleteRefreshToken,
    deleteOldVerificationTokens,
    saveNewResendVerificationToken,
    deletePasswordResetTokens,
    createPasswordResetToken,
    findResetPasswordToken,
    resetPasswordAndRevoke,
    findUserById,
    createGoogleUser,
    activateVerifiedGoogleUser,
} from "./auth.repository.js";
import { hashPassword, verifyPassword } from "../../utils/auth.utils.js";
import { sendEmail } from "../../services/email.transporter.js";
import {
    passwordResetSuccessTemplate,
    resetPasswordEmailTemplate,
    verificationEmailTemplate,
    welcomeEmailTemplate,
} from "../../services/email.templates.js";
import { generateAccessToken, generateRefreshToken } from "./token.service.js";
import crypto, { randomBytes } from "crypto";
import {
    cacheUserSession,
    deleteUserSession,
    getUserSession,
} from "../../infrastructure/cache/session.cache.js";
import { redis } from "../../infrastructure/cache/redis.client.js";

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

    await sendEmail(user.email, subject, html);

    return { user };
};

export const googleLoginService = async (profile: { email: string; name: string }, deviceInfo: DeviceInfo) => {
    let user = await findUserByEmail(profile.email);
    if (!user) {
        user = await createGoogleUser({
            email: profile.email,
            name: profile.name ?? profile.email.split("@")[0],
            password: await hashPassword(crypto.randomBytes(32).toString("hex")),
        });
    } else if (!user.isEmailVerified || user.status === "PENDING") {
        user = await activateVerifiedGoogleUser(user.id);
    }
    if (user.status !== "ACTIVE") throw new AppError("This account is not available for sign in.", 403);
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);
    await saveRefreshTokenAndUpdateLastLogin(user.id, crypto.createHash("sha256").update(refreshToken).digest("hex"), deviceInfo);
    await cacheUserSession({ id: user.id, name: user.name, email: user.email, role: user.role, status: user.status, passwordChangedAt: user.passwordChangedAt });
    return { accessToken, refreshToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
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
    const { subject, html } = welcomeEmailTemplate(verification.user.email);
    await sendEmail(verification.user.email, subject, html);

    return {
        message: "Email verified successfully. You can now log in.",
    };
};

// login service
export const loginService = async (userData: LoginDto,deviceInfo:DeviceInfo) => {
    const user = await findUserByEmail(userData.email);

    if (!user) {
        throw new AppError("Invalid password or Email", 401);
    }

    // Verify password first to prevent user enumeration and timing leaks
    const isPasswordValid = await verifyPassword(userData.password, user.password);

    if (!isPasswordValid) {
        throw new AppError("Invalid password or Email", 401);
    }

    // Possession of valid credentials established: now enforce account state policies
    if (!user.isEmailVerified) {
        throw new AppError("Please verify your email before logging in.", 403);
    }
    if (user.status === "DELETED") {
        throw new AppError("Account no longer exists.", 403)
    }

    if (user.status === "SUSPENDED") {
        throw new AppError("Your account has been Suspended.Please contact support", 403);
    }

    if (user.status === "DEACTIVATED") {

        const reactivationKey = randomBytes(32).toString('hex')
        await redis.set(
            `reactivate:${reactivationKey}`,
            user.id,
            "EX",
            60 * 10 // 10 minutes
        )

        return {
            code:"ACCOUNT_DEACTIVATED",
            message:"Your account is deactivated",
            reactivationKey
        }
    }

    const accessToken = generateAccessToken(user.id, user.role);

    const refreshToken = generateRefreshToken(user.id);

    const refreshHashedToken = crypto.createHash("sha256").update(refreshToken).digest("hex");

    // save to the refresh token  and last login at
    await saveRefreshTokenAndUpdateLastLogin(user.id, refreshHashedToken,deviceInfo);

    // cache session in redis

    await cacheUserSession({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        passwordChangedAt: user.passwordChangedAt,
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
        const dbUser = await findUserById(existingToken.userId);
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
        passwordChangedAt: user.passwordChangedAt,
    });
    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
    };
};

// logout service

export const logoutService = async (userId: string, token: string) => {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    await deleteRefreshToken(hashedToken);

    await deleteUserSession(userId);

    return {
        message: "Logged out successfully.",
    };
};

//new verification email service

export const resendVerificationService = async (email: string): Promise<{ message: string }> => {
    // find email in the data base
    const RESEND_MESSAGE = "If this email is registered, you will receive a verification link.";
    const user = await findUserByEmail(email);
    if (!user)
        return {
            message: RESEND_MESSAGE,
        };

    if (user.isEmailVerified) {
        return {
            message: RESEND_MESSAGE,
        };
    }
    if (user.status === "SUSPENDED" || user.status === "DELETED") {
        return {
            message: RESEND_MESSAGE,
        };
    }

    // delete old verification
    await deleteOldVerificationTokens(user.id);

    // generate new token

    let newToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(newToken).digest("hex");

    await saveNewResendVerificationToken(user.id, hashedToken);

    const { html, subject } = verificationEmailTemplate(user.name, newToken);
    await sendEmail(user.email, subject, html);

    return {
        message: RESEND_MESSAGE,
    };
};

// forget service

export const forgotPasswordService = async (email: string) => {
    const user = await findUserByEmail(email);

    const RESEND_MESSAGE = "If this email is registered, you will receive a verification link.";

    if (!user || !user.isEmailVerified) {
        return { message: RESEND_MESSAGE };
    }

    if (user.status === "SUSPENDED" || user.status === "DELETED") {
        return { message: RESEND_MESSAGE };
    }

    await deletePasswordResetTokens(user.id);

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    await createPasswordResetToken(user.id, hashedToken);

    const { html, subject } = resetPasswordEmailTemplate(user.name, rawToken);
    await sendEmail(user.email, subject, html);

    return {
        message: RESEND_MESSAGE,
    };
};

// reset password service

export const resetPasswordService = async (token: string, password: string) => {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const resetToken = await findResetPasswordToken(hashedToken);

    if (!resetToken) {
        throw new AppError("Invalid or expired reset link. ", 403);
    }

    if (resetToken.expiresAt <= new Date()) {
        throw new AppError("Reset link has expired", 400);
    }

    if (resetToken.used === true) {
        throw new AppError("Reset Link already used.", 400);
    }

    const hashedPassword = await hashPassword(password);

    await resetPasswordAndRevoke(resetToken.id, resetToken.userId, hashedPassword);

    await deleteUserSession(resetToken.userId);

    await recordAuditLog({
        userId: resetToken.userId,
        action: "UPDATE",
        entity: "USER_PASSWORD",
        entityId: resetToken.userId,
        oldValue: { email: resetToken.user.email },
        newValue: { email: resetToken.user.email, resetMethod: "USER_SELF_RESET_LINK" },
    });

    const { subject, html } = passwordResetSuccessTemplate(resetToken.user.name);

    await sendEmail(resetToken.user.email, subject, html);

    return {
        message: "Password reset successful. Please log in with your new password.",
    };
};
