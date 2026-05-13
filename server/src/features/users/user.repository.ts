import { prisma } from "../../config/db.js";

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
