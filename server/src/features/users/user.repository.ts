import { prisma } from "../../config/db.js";
import { UpdateProfileDto } from "./user.types.js";
import crypto from "crypto";

export const getUserProfile = async (userId: string) => {
    return prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
            profile: {
                select: {
                    phone: true,
                    avatar: true,
                    address: true,
                    city: true,
                    country: true,
                },
            },
        },
    });
};

// for profile update no password
export const findUserById = async (userId: string) => {
    return prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            status: true,
            role: true,
            name: true,
            email: true,
            passwordChangedAt: true,
            profile: {
                select: { avatar: true },
            },
        },
    });
};

// for password change -only what is needed
export const findUserWithPassword = async (userId: string) => {
    return prisma.user.findUnique({
        where: { id: userId },
        select: {
            password: true,
            id: true,
            name: true,
            email: true,
            status: true,
        },
    });
};

export const updateUserProfileRepository = async (userId: string, data: UpdateProfileDto) => {
    const { name, city, address, country, avatar, phone } = data;
    return prisma.user.update({
        where: { id: userId },
        data: {
            // only included if name is provided
            ...(name !== undefined && { name }),
            profile: {
                upsert: {
                    create: {
                        phone,
                        avatar,
                        address,
                        city,
                        country,
                    },
                    update: {
                        phone,
                        avatar,
                        address,
                        city,
                        country,
                    },
                },
            },
        },
        select: {
            id: true,
            name: true,
            email: true,
            profile: true,
        },
    });
};

export const updatePasswordAndDeleteRefreshToken = async (
    userId: string,
    hashedPassword: string,
) => {
    return prisma.$transaction(async (tx) => {
        // update password
        await tx.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                passwordChangedAt: new Date(),
            },
            select: {
                id: true,
                email: true,
                name: true,
            },
        });

        // delete Refresh token
        await tx.refreshToken.deleteMany({
            where: { userId },
        });
    });
};

// deactivate user repository

export const deactivateAccountRepository = async (userId: string) => {
    return prisma.$transaction(async (tx) => {
        await tx.user.update({
            where: { id: userId },
            data: {
                status: "DEACTIVATED",
            },
        });

        await tx.refreshToken.deleteMany({
            where: { userId },
        });
    });
};

// reactivate account repository
export const reactivateAccountRepository = async (userId: string) => {
    return prisma.user.update({
        where: { id: userId },
        data: { status: "ACTIVE", deletedAt: null },
        select: {
            id: true,
            name: true,
            role: true,
            email: true,
            passwordChangedAt: true,
        },
    });
};
export const saveRefreshTokenAndUpdateLastLogin = async (
    userId: string,
    hashedRefresh: string,
    expiresAt: Date,
) => {
    return prisma.$transaction(async (tx) => {
        await tx.refreshToken.create({
            data: {
                userId,
                token: hashedRefresh,
                expiresAt,
            },
        });

        await tx.user.update({
            where: { id: userId },
            data: { lastLoginAt: new Date() },
        });
    });
};

export const deleteAccountRepositoryAndClearToken = async (userId: string) => {
    return prisma.$transaction(async (tx) => {
        await tx.user.update({
            where: { id: userId },
            data: {
                status: "DELETED",
                deletedAt: new Date(),
            },
        });

        await tx.refreshToken.deleteMany({
            where: { userId: userId },
        });
    });
};

export const anonymizeUserRecord = async (userId: string) => {
    await prisma.$transaction(async (tx) => {
        await tx.user.update({
            where: { id: userId },
            data: {
                name: "Deleted User",
                email: `deleted_${userId}@deleted.com`,
                password: crypto.randomBytes(32).toString("hex"),
            },
        });

        await tx.userProfile.updateMany({
            where: { userId },
            data: {
                phone: null,
                address: null,
                city: null,
                country: null,
                avatar: null,
            },
        });
    });
};

//get user session

export const getUserSessions = async(userId:string)=>{
    return prisma.refreshToken.findMany({
        where:{ userId,
            expiresAt: {  gt:new Date() }
        },
        select:{
            id:true,
            token:true,
            deviceName:true,
            ipAddress:true,
            createdAt:true,
            expiresAt:true
        },
        orderBy:{ createdAt:'desc' } // new first
    })
}


export const getSessionById = async(id:string)=>{
    return prisma.refreshToken.findUnique({
        where : { id },
    })
}

export const deleteSessionById =(id:string)=>{
    return prisma.refreshToken.delete({
        where:{ id },
    })
}

export const deleteAllOtherSessions = async(userId:string,currentHashedToken:string)=>{
    return prisma.refreshToken.deleteMany({
        where:{
            userId,
            token:{ not:currentHashedToken }
        }
    })
}