import { prisma } from "../../config/db.js";
import { RegisterDto } from "./auth.types.js";
import crypto from "crypto";
import { Prisma } from "@prisma/client/extension";
import { env } from "../../config/env.js";
import { DeviceInfo } from "./auth.types.js";
//  find user by email
export const findUserByEmail = async (email: string) => {
    return prisma.user.findUnique({
        where: { email },
        select: {
            id: true,
            name: true,
            email: true,
            password: true,
            role: true,
            status: true,
            passwordChangedAt: true,
            isEmailVerified:true ,// ← MUST be here
        },
    });
};

export const createGoogleUser = async (data: { name: string; email: string; password: string }) => {
    return prisma.user.create({
        data: { ...data, isEmailVerified: true, status: "ACTIVE" },
        select: { id: true, name: true, email: true, password: true, role: true, status: true, isEmailVerified: true, passwordChangedAt: true },
    });
};

export const activateVerifiedGoogleUser = async (id: string) => {
    return prisma.user.update({
        where: { id },
        data: { isEmailVerified: true, status: "ACTIVE" },
        select: { id: true, name: true, email: true, password: true, role: true, status: true, isEmailVerified: true, passwordChangedAt: true },
    });
};


export const createUserWithVerification = async (
    data: RegisterDto & { hashedPassword: string },
) => {
    // generate random token
    const rawToken = crypto.randomBytes(32).toString("hex");

    // hash it before storing

    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    const user = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // create user

        const newUser = await tx.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: data.hashedPassword,
            },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
            },
        });

        // create the same verification record in the same transaction
        await tx.emailVerification.create({
            data: {
                userId: newUser.id,
                token: hashedToken,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hour
            },
        });
        return newUser;
    });

    // send raw token in email, store hashed token in DB
    return { user, rawToken };
};

export const findEmailVerification = async (hashedToken: string) => {
    return prisma.emailVerification.findUnique({
        where: { token: hashedToken },
        include: { user: true }, //grab the user in the same query
    });
};

export const markEmailVerified = async (userId: string, verificationId: string) => {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // flip user to active
        await tx.user.update({
            where: { id: userId },
            data: {
                isEmailVerified: true,
                status: "ACTIVE",
            },
        });

        // delete the record entirely
        await tx.emailVerification.delete({
            where: { id: verificationId },
        });
    });
};

// save refresh token and last login at

export const saveRefreshTokenAndUpdateLastLogin = async (userId: string, token: string,deviceInfo:DeviceInfo) => {
    return prisma.$transaction(async (tx) => {
        // step 1 count existing sessions  to limit the number of  device his is login
        const sessionCount = await tx.refreshToken.count({
            where: { userId },
        });

        if (sessionCount >= env.DEVICE_LIMIT) {
            const oldest = await tx.refreshToken.findFirst({
                where: { userId },
                orderBy: { createdAt: "asc" }, // oldest first
            });

            if (oldest) {
                await tx.refreshToken.delete({
                    where: { id: oldest.id },
                });
            }
        }
        // save refresh token
        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
        await tx.refreshToken.create({
            data: {
                userId,
                token,
                expiresAt: new Date(Date.now() + SEVEN_DAYS_MS),
                ipAddress:deviceInfo.ipAddress,
                userAgent: deviceInfo.userAgent,
                deviceName: deviceInfo.deviceName,
            },
        });

        // save last login
        await tx.user.update({
            where: { id: userId },
            data: {
                lastLoginAt: new Date(),
            },
        });
    });
};

// find refresh token
export const findRefreshToken = async (hashedToken: string) => {
    return prisma.refreshToken.findFirst({
        where: { token: hashedToken },
        //  include: { user : true }
    });
};

// find user by id
export const findUserById = async (id: string) => {
    return prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            passwordChangedAt: true,
        },
    });
};
  
// delete the old token and create new one
export const rotateRefreshToken = async (
    oldTokenId: string,
    userId: string,
    newHashedToken: string,
    deviceInfo?: DeviceInfo,
) => {
    return prisma.$transaction(async (tx) => {
        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
        const oldRecord = await tx.refreshToken.findUnique({
            where: { id: oldTokenId },
            select: { ipAddress: true, userAgent: true, deviceName: true },
        });

        // delete old one
        await tx.refreshToken.deleteMany({
            where: { id: oldTokenId },
        });

        // create new one
        await tx.refreshToken.create({
            data: {
                userId,
                token: newHashedToken,
                expiresAt: new Date(Date.now() + SEVEN_DAYS_MS),
                ipAddress: deviceInfo?.ipAddress ?? oldRecord?.ipAddress,
                userAgent: deviceInfo?.userAgent ?? oldRecord?.userAgent,
                deviceName: deviceInfo?.deviceName ?? oldRecord?.deviceName,
            },
        });
    });
};

export const deleteRefreshToken = async (hashedToken: string) => {
    return prisma.refreshToken.deleteMany({
        where: { token: hashedToken },
    });
};

// delete old verification tokens
export const deleteOldVerificationTokens = async (userId: string) => {
    return prisma.emailVerification.deleteMany({
        where: { userId },
    });
};

// save new token to the database

export const saveNewResendVerificationToken = async (userId: string, hashedToken: string) => {
    const TWENTY_FOUR_HOUR = 1 * 24 * 60 * 60 * 1000;
    return prisma.emailVerification.create({
        data: {
            token: hashedToken,
            userId: userId,
            expiresAt: new Date(Date.now() + TWENTY_FOUR_HOUR), // FOR 24
        },
        select: {
            token: true,
            userId: true,
            expiresAt: true,
        },
    });
};

// delete reset  token

export const deletePasswordResetTokens = async (userId: string) => {
    return prisma.passwordReset.deleteMany({
        where: { userId },
    });
};

export const createPasswordResetToken = async (userId: string, hashedToken: string) => {
    return prisma.passwordReset.create({
        data: {
            userId,
            token: hashedToken,
            expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000),
            used: false,
        },
    });
};

export const findResetPasswordToken = async (hashedToken: string) => {
    return prisma.passwordReset.findUnique({
        where: { token: hashedToken },
        include: { user: true },
    });
};

export const resetPasswordAndRevoke = async (
    resetTokenId: string,
    userId: string,
    hashedPassword: string,
) => {
    return prisma.$transaction(async (tx) => {
        // update password and invalidate all existing active access tokens
        await tx.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                passwordChangedAt: new Date(),
            },
        });

        // mark token as used
        await tx.passwordReset.update({
            where: { id: resetTokenId },
            data: { used: true },
        });

        // kill all refresh tokens — force logout all devices
        await tx.refreshToken.deleteMany({
            where: { userId },
        });
    });
};
