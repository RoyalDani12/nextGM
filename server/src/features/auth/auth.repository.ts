import { prisma } from "../../config/db.js";
import { RegisterDto } from "./auth.types.js";
import crypto from "crypto";
import { Prisma } from "@prisma/client/extension";

//  find user by email
export const findUserByEmail = async (email: string) => {
    return prisma.user.findUnique({
        where: { email },
    });
};

//  add transaction function that creates user +  verification token together

export const createUserWithVerification = async (
    data: RegisterDto & { hashedPassword: string },
) => {
    // generate random token
    const rawToken = crypto.randomBytes(32).toString("hex");

    // hash it before storing

    const hashedToken = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

    const user = await prisma.$transaction(async (tx:Prisma.TransactionClient) => {
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

export const markEmailVerified = async (
    userId: string,
    verificationId: string,
) => {
    return prisma.$transaction(async (tx:Prisma.TransactionClient) => {
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
 