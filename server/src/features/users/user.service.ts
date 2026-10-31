import { recordAuditLog } from '../admin/audit.service.js';
import { cloudinary } from "../../infrastructure/storage/cloudinary.client.js";
import { AppError } from "../../middleware/appError.js";

import {
    findUserById,
    getUserProfile,
    updateUserProfileRepository,
    updatePasswordAndDeleteRefreshToken,
    findUserWithPassword,
    deactivateAccountRepository,
    reactivateAccountRepository,
    saveRefreshTokenAndUpdateLastLogin,
    deleteAccountRepositoryAndClearToken,
    getUserSessions,
    getSessionById,
    deleteSessionById,
    deleteAllOtherSessions,
} from "./user.repository.js";
import { changePasswordDto, UpdateProfileDto, RevokeSessionInput } from "./user.types.js";
import { env } from "../../config/env.js";
import { extractPublicIdFromUrl } from "../../utils/cloudinaryHelper.js";
import { emailQueue, imageCleanupQueue } from "../../infrastructure/queue/queue.client.js";
import { hashPassword, verifyPassword } from "../../services/token.service.js";
import { cacheUserSession, deleteUserSession } from "../../infrastructure/cache/session.cache.js";
import { redis } from "../../infrastructure/cache/redis.client.js";
import { generateAccessToken, generateRefreshToken } from "../auth/token.service.js";
import crypto from "crypto";
import { accountDeletionScheduledTemplate } from "../../services/email.templates.js";
import { accountPurgeQueue } from "../../infrastructure/queue/queue.client.js";

export const getMeService = async (userId: string) => {
    const user = await getUserProfile(userId);

    if (!user) {
        throw new AppError("User not found.", 404);
    }

    // return  profile data
    return user;
};

// cloudinary service
export const generateAvatarUploadSignatureService = async (userId: string) => {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = `user_avatars/${userId}`;

    const signature = cloudinary.utils.api_sign_request(
        {
            timestamp,
            folder,
            // allowed_formats: "jpg,png,webp",
            // max_file_size: 5000000,
        },
        env.CLOUDINARY_API_SECRET,
    );

    return {
        signature,
        timestamp,
        folder,
        apiKey: env.CLOUDINARY_API_KEY,
        cloudName: env.CLOUDINARY_CLOUD_NAME,
    };
};

// update profile service
export const updateUserProfileService = async (userId: string, body: UpdateProfileDto) => {
    const userExists = await findUserById(userId);

    if (!userExists) {
        throw new AppError("User not found.", 404);
    }
    // check the user sends data or empty
    const hasUpdates = Object.values(body).some((v) => v !== undefined);
    if (!hasUpdates) throw new AppError("No update data provided.", 400);
    const oldAvatarUrl = userExists?.profile?.avatar;

    const updateUser = await updateUserProfileRepository(userId, body);

    if (!updateUser) {
        throw new AppError("Failed to update profile", 500);
    }

    if (updateUser && body.avatar && oldAvatarUrl && oldAvatarUrl !== body.avatar) {
        const publicId = extractPublicIdFromUrl(oldAvatarUrl);
        if (publicId) {
            // add to the queue and return to user immediately
            await imageCleanupQueue.add("cleanup-avatar", { publicId });
        }
    }
    return updateUser;
};

// change password service

export const changePasswordService = async (userId: string, body: changePasswordDto) => {
    const { oldPassword, newPassword } = body;

    const user = await findUserWithPassword(userId);

    if (!user) {
        throw new AppError("User not found.", 404);
    }

    //verify old password
    const isMatch = await verifyPassword(oldPassword, user.password);

    if (!isMatch) {
        throw new AppError("Invalid current password.", 401);
    }

    // hash new password
    const hashedPassword = await hashPassword(newPassword);

    await updatePasswordAndDeleteRefreshToken(userId, hashedPassword);

    await deleteUserSession(userId);

    return {
        message: "Password updated. Please login again.",
    };
};

// deactivate service
export const deactivateAccountService = async (userId: string, password: string) => {
    const user = await findUserWithPassword(userId);
    if (!user) {
        throw new AppError("User is not found.", 404);
    }
    const isMatchPassword = await verifyPassword(password, user.password);

    if (!isMatchPassword) {
        throw new AppError("Incorrect password", 401);
    }

    await deactivateAccountRepository(userId);
    await deleteUserSession(userId);
    await recordAuditLog({
        userId,
        action: "UPDATE",
        entity: "USER_STATUS",
        entityId: userId,
        oldValue: { status: user.status },
        newValue: { status: "DEACTIVATED", selfInitiated: true },
    });

    return {
        message: "Account deactivated successfully.To activate Contact support via email.",
    };
};

// reactivate account services

export const reactivateAccountService = async (reactivationKey: string) => {
    const userId = await redis.get(`reactivate:${reactivationKey}`);
    if (!userId) {
        throw new AppError("Invalid or expired link.please login again.", 401);
    }
    // for one time use
    await redis.del(`reactivate:${reactivationKey}`);

    const user = await findUserById(userId);

    if (!user) {
        throw new AppError("User not found", 404);
    }
    if (user.status !== "DEACTIVATED") {
        throw new AppError("Account is not deactivated.", 400);
    }

    await reactivateAccountRepository(userId);

    const accessToken = generateAccessToken(userId, user.role);
    const refreshToken = generateRefreshToken(userId);

    const hashedRefresh = crypto.createHash("sha256").update(refreshToken).digest("hex");

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await saveRefreshTokenAndUpdateLastLogin(userId, hashedRefresh, expiresAt);

    await cacheUserSession({
        id: userId,
        name: user.name,
        email: user.email,
        role: user.role,
        status: "ACTIVE",
        passwordChangedAt: user.passwordChangedAt,
    });

    return {
        accessToken,
        refreshToken,
        message: "Account reactivated successfully.",
        user: {
            id: userId,
            name: user.name,
            email: user.email,
            role: user.role,
        },
    };
};

// delete account service
export const deleteAccountService = async (userId: string, password: string) => {
    const user = await findUserWithPassword(userId);

    if (!user) {
        throw new AppError("User not  found.", 404);
    }

    if (user.status === "DELETED" || user.status === "PERMANENTLY_ANONYMIZED") {
        throw new AppError("Account is already deleted or scheduled for deletion.", 400);
    }
    const isMatch = await verifyPassword(password, user.password);

    if (!isMatch) {
        throw new AppError("Incorrect Password!.", 401);
    }
    await deleteAccountRepositoryAndClearToken(userId);
    await deleteUserSession(userId);
    await recordAuditLog({
        userId,
        action: "UPDATE",
        entity: "USER_STATUS",
        entityId: userId,
        oldValue: { status: user.status },
        newValue: { status: "DELETED", selfInitiated: true },
    });

    const reactivationKeyToken = crypto.randomBytes(32).toString("hex");
    const { html, subject } = accountDeletionScheduledTemplate(user.name, reactivationKeyToken);
    await emailQueue.add("send-scheduled-deletion-email", {
        to: user.email,
        html,
        subject,
    });

    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    await accountPurgeQueue.add(
        "anonymize-user",
        { userId: user.id },
        {
            delay: THIRTY_DAYS_MS,
            jobId: `purge-${user.id}`,
            removeOnComplete: true,
        },
    );

    return {
        message: "Your account has been deactivated and scheduled for permanent deletion.",
    };
};

// session service
export const getSessionsService = async (userId: string, currentToken: string) => {
    const sessions = await getUserSessions(userId);

    const hashedCurrentToken = currentToken
        ? crypto.createHash("sha256").update(currentToken).digest("hex")
        : "";
    return sessions.map((session) => ({
        id: session.id,
        deviceName: session.deviceName ?? "Unknown device",
        ipAddress: session.ipAddress ?? "Unknown IP",
        createdAt: session.createdAt,
        isCurrentSession: session.token === hashedCurrentToken,
        expiresAt: session.expiresAt,
    }));
};

// revoke session service
export const revokeSessionService = async ({
    userId,
    sessionId,
    currentToken,
}: RevokeSessionInput) => {
    const session = await getSessionById(sessionId);

    if (!session) {
        throw new AppError("session not found", 404);
    }
    if (session.userId !== userId) {
        throw new AppError("Unauthorized to revoke this session", 403);
    }
    const hashedCurrentToken = currentToken
        ? crypto.createHash("sha256").update(currentToken).digest("hex")
        : "";
    const isCurrentSession = session.token === hashedCurrentToken;
    if (isCurrentSession) {
        throw new AppError("Cannot delete your current session. Use logout instead.", 400);
    }
    await deleteSessionById(sessionId);

    return {
        isCurrentSession,
        message: "Session revoked successfully.",
    };
};

export const revokeAllSessionsService = async (userId: string, currentToken: string) => {
    if (!currentToken) {
        throw new AppError("Current session token is required to preserve it.", 400);
    }

    const hashedCurrentToken = crypto.createHash("sha256").update(currentToken).digest("hex");

    const result = await deleteAllOtherSessions(userId, hashedCurrentToken);

    return {
        revokedCount: result.count,
    };
};
