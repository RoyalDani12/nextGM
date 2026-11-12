import { prisma } from "../../config/db.js";

const adminReturnInclude = {
    items: {
        include: {
            orderItem: {
                include: {
                    product: { select: { name: true, images: { select: { url: true }, take: 1, orderBy: { isPrimary: "desc" } } } },
                    variant: { select: { name: true } },
                },
            },
        },
    },
    statusHistory: { orderBy: { createdAt: "asc" as const } },
    order: {
        select: {
            id: true,
            totalAmount: true,
            customer: { select: { name: true, email: true } },
            shop: { select: { id: true, slug: true, profile: { select: { name: true } } } },
        },
    },
} as const;

// ─────────────────────────────────────────────
// PLATFORM STATS
// ─────────────────────────────────────────────
export const getPlatformStats = async () => {
    const [totalUsers, totalShops, totalOrders, platformWallet, settledOrdersAgg] = await Promise.all([
        prisma.user.count({ where: { status: { not: "DELETED" } } }),
        prisma.shop.count({ where: { status: { not: "CLOSED" } } }),
        prisma.order.count(),
        prisma.platformWallet.findFirst(),
        prisma.order.aggregate({
            where: { status: { in: ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] } },
            _sum: { totalAmount: true },
        }),
    ]);

    // Calculate 10% platform commission from each settled order
    const grossVolume = Number(settledOrdersAgg?._sum?.totalAmount ?? 0);
    const calculated10PctCommission = Math.round(grossVolume * 0.10 * 100) / 100;
    const recordedWalletBalance = platformWallet ? Number(platformWallet.balance) : 0;
    const effectivePlatformBalance = Math.max(recordedWalletBalance, calculated10PctCommission);

    // Sync database platformWallet record so DB always holds the 10% cut
    if (!platformWallet) {
        try {
            await prisma.platformWallet.create({ data: { balance: effectivePlatformBalance } });
        } catch {
            // ignore parallel creation race
        }
    } else if (recordedWalletBalance < calculated10PctCommission) {
        try {
            await prisma.platformWallet.update({
                where: { id: platformWallet.id },
                data: { balance: effectivePlatformBalance },
            });
        } catch {
            // ignore
        }
    }

    // Monthly signups for last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyUsers = await prisma.$queryRaw<{ month: string; count: bigint }[]>`
        SELECT TO_CHAR("createdAt", 'YYYY-MM') as month, COUNT(*) as count
        FROM "User"
        WHERE "createdAt" >= ${sixMonthsAgo}
        GROUP BY month
        ORDER BY month ASC
    `;

    const monthlyShops = await prisma.$queryRaw<{ month: string; count: bigint }[]>`
        SELECT TO_CHAR("createdAt", 'YYYY-MM') as month, COUNT(*) as count
        FROM "Shop"
        WHERE "createdAt" >= ${sixMonthsAgo}
        GROUP BY month
        ORDER BY month ASC
    `;

    const monthlyOrders = await prisma.$queryRaw<{ month: string; count: bigint; revenue: number }[]>`
        SELECT TO_CHAR(o."createdAt", 'YYYY-MM') as month, COUNT(*) as count, COALESCE(SUM(o."totalAmount"), 0) as revenue
        FROM "Order" o
        WHERE o."createdAt" >= ${sixMonthsAgo}
        GROUP BY month
        ORDER BY month ASC
    `;

    return {
        totalUsers,
        totalShops,
        totalOrders,
        platformBalance: effectivePlatformBalance,
        grossVolume,
        monthlyUsers: monthlyUsers.map(r => ({ month: r.month, count: Number(r.count) })),
        monthlyShops: monthlyShops.map(r => ({ month: r.month, count: Number(r.count) })),
        monthlyOrders: monthlyOrders.map(r => ({ month: r.month, count: Number(r.count), revenue: Number(r.revenue) })),
    };
};

// ─────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────
export const listUsersAdmin = async (filters: {
    role?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
}) => {
    const { role, status, search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
        status: { not: "DELETED" },
        ...(role && { role: role as any }),
        ...(status && { status: status as any }),
        ...(search && {
            OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ],
        }),
    };

    const [users, total, totalAll, roleStats, statusStats] = await Promise.all([
        prisma.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
                profile: { select: { avatar: true, phone: true } },
                ownedShops: { select: { id: true, slug: true, status: true }, take: 1 },
            },
        }),
        prisma.user.count({ where }),
        prisma.user.count({ where: { status: { not: "DELETED" } } }),
        prisma.user.groupBy({
            by: ["role"],
            where: { status: { not: "DELETED" } },
            _count: { id: true },
        }),
        prisma.user.groupBy({
            by: ["status"],
            where: { status: { not: "DELETED" } },
            _count: { id: true },
        }),
    ]);

    const stats = {
        total: totalAll,
        customers: roleStats.find((r) => r.role === "CUSTOMER")?._count?.id ?? 0,
        shopOwners: roleStats.find((r) => r.role === "SHOP_OWNER")?._count?.id ?? 0,
        superAdmins: roleStats.find((r) => r.role === "SUPER_ADMIN")?._count?.id ?? 0,
        shopEmployees: roleStats.find((r) => r.role === "SHOP_EMPLOYEE")?._count?.id ?? 0,
        active: statusStats.find((s) => s.status === "ACTIVE")?._count?.id ?? 0,
        suspended: statusStats.find((s) => s.status === "SUSPENDED")?._count?.id ?? 0,
        pending: statusStats.find((s) => s.status === "PENDING")?._count?.id ?? 0,
    };

    return { users, total, page, limit, totalPages: Math.ceil(total / limit), stats };
};

export const getUserByIdAdmin = async (id: string) => {
    return prisma.user.findUnique({
        where: { id },
        include: {
            profile: true,
            ownedShops: {
                select: { id: true, slug: true, status: true, createdAt: true, profile: { select: { name: true } } },
            },
        },
    });
};

export const updateUserRoleAdmin = async (id: string, role: string) => {
    return prisma.user.update({ where: { id }, data: { role: role as any } });
};

export const updateUserStatusAdmin = async (id: string, status: string, adminUserId?: string) => {
    const existing = await prisma.user.findUnique({ where: { id }, select: { id: true, status: true, email: true } });
    if (!existing) return null;

    const updated = await prisma.user.update({ where: { id }, data: { status: status as any } });

    if (status === "SUSPENDED" || status === "DEACTIVATED") {
        await prisma.refreshToken.deleteMany({ where: { userId: id } });
    }

    if (adminUserId) {
        await prisma.auditLog.create({
            data: {
                userId: adminUserId,
                action: "UPDATE",
                entity: "USER_STATUS",
                entityId: id,
                oldValue: { status: existing.status },
                newValue: { status },
            },
        });
    }

    return updated;
};

export const updateUserProfileAdmin = async (
    id: string,
    data: { name?: string; email?: string; role?: string; phone?: string },
    adminUserId?: string
) => {
    const existing = await prisma.user.findUnique({
        where: { id },
        include: { profile: true },
    });
    if (!existing) return null;

    const userUpdateData: any = {};
    if (data.name) userUpdateData.name = data.name;
    if (data.email) userUpdateData.email = data.email.toLowerCase();
    if (data.role) userUpdateData.role = data.role as any;

    const updated = await prisma.user.update({
        where: { id },
        data: userUpdateData,
        include: { profile: true },
    });

    if (data.phone !== undefined) {
        await prisma.userProfile.upsert({
            where: { userId: id },
            create: { userId: id, phone: data.phone },
            update: { phone: data.phone },
        });
    }

    if (adminUserId) {
        await prisma.auditLog.create({
            data: {
                userId: adminUserId,
                action: "UPDATE",
                entity: "USER_PROFILE",
                entityId: id,
                oldValue: { name: existing.name, email: existing.email, role: existing.role, phone: existing.profile?.phone },
                newValue: data,
            },
        });
    }

    return prisma.user.findUnique({ where: { id }, include: { profile: true } });
};

export const resetUserPasswordAdmin = async (id: string, passwordHash: string, adminUserId?: string) => {
    const updated = await prisma.user.update({
        where: { id },
        data: {
            password: passwordHash,
            passwordChangedAt: new Date(),
        },
        select: { id: true, email: true, name: true },
    });

    // Invalidate all active refresh tokens for security
    await prisma.refreshToken.deleteMany({ where: { userId: id } });

    if (adminUserId) {
        await prisma.auditLog.create({
            data: {
                userId: adminUserId,
                action: "UPDATE",
                entity: "USER_PASSWORD_RESET",
                entityId: id,
                newValue: { resetByAdmin: true, timestamp: new Date() },
            },
        });
    }

    return updated;
};

export const bulkUpdateUsersStatusAdmin = async (userIds: string[], status: string, adminUserId?: string) => {
    const res = await prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { status: status as any },
    });

    if (status === "SUSPENDED" || status === "DEACTIVATED") {
        await prisma.refreshToken.deleteMany({ where: { userId: { in: userIds } } });
    }

    if (adminUserId) {
        await prisma.auditLog.create({
            data: {
                userId: adminUserId,
                action: "UPDATE",
                entity: "USER_BULK_STATUS",
                entityId: userIds.join(",").slice(0, 50),
                newValue: { count: res.count, status, userIds },
            },
        });
    }

    return res;
};

export const getUsersByIdsAdmin = async (userIds: string[]) => {
    return prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true, status: true },
    });
};

// ─────────────────────────────────────────────
// SHOPS & VERIFICATION WORKFLOW
// ─────────────────────────────────────────────
export const listShopsAdmin = async (filters: {
    status?: string;
    verificationStatus?: string;
    riskLevel?: string;
    tab?: "all" | "pending_queue" | "flagged";
    search?: string;
    page?: number;
    limit?: number;
}) => {
    const { status, verificationStatus, riskLevel, tab = "all", search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
        where.status = status as any;
    }

    if (verificationStatus) {
        where.legalInfo = {
            ...(where.legalInfo || {}),
            businessVerificationStatus: verificationStatus as any,
        };
    }

    if (riskLevel) {
        where.riskFlags = {
            some: {
                resolved: false,
                severity: riskLevel as any,
            },
        };
    }

    if (tab === "pending_queue") {
        where.OR = [
            { status: "PENDING" },
            { legalInfo: { businessVerificationStatus: { in: ["PENDING", "IN_REVIEW", "UNVERIFIED"] } } },
        ];
    } else if (tab === "flagged") {
        where.riskFlags = {
            some: {
                resolved: false,
            },
        };
    }

    if (search && search.trim()) {
        const query = search.trim();
        const searchConditions = [
            { slug: { contains: query, mode: "insensitive" } },
            { profile: { name: { contains: query, mode: "insensitive" } } },
            { profile: { email: { contains: query, mode: "insensitive" } } },
            { owner: { name: { contains: query, mode: "insensitive" } } },
            { owner: { email: { contains: query, mode: "insensitive" } } },
            { legalInfo: { legalBusinessName: { contains: query, mode: "insensitive" } } },
            { legalInfo: { taxId: { contains: query, mode: "insensitive" } } },
        ];

        if (where.OR) {
            where.AND = [
                { OR: where.OR },
                { OR: searchConditions },
            ];
            delete where.OR;
        } else {
            where.OR = searchConditions;
        }
    }

    const [shops, total, pendingCount, inReviewCount, activeCount, suspendedCount, highRiskCount] = await Promise.all([
        prisma.shop.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                slug: true,
                status: true,
                healthScore: true,
                rejectionReason: true,
                suspensionReason: true,
                closureReason: true,
                createdAt: true,
                updatedAt: true,
                owner: { select: { id: true, name: true, email: true, isEmailVerified: true } },
                profile: { select: { logo: true, name: true, phone: true, email: true, city: true, country: true } },
                wallet: { select: { balance: true, payoutsEnabled: true } },
                legalInfo: {
                    select: {
                        id: true,
                        legalBusinessName: true,
                        taxId: true,
                        entityType: true,
                        businessVerificationStatus: true,
                        taxIdStatus: true,
                        addressVerificationStatus: true,
                        ownerKycStatus: true,
                        _count: { select: { documents: true } },
                    },
                },
                riskFlags: {
                    where: { resolved: false },
                    select: { id: true, flag: true, severity: true },
                },
                _count: { select: { products: true, orders: true } },
            },
        }),
        prisma.shop.count({ where }),
        prisma.shop.count({
            where: {
                OR: [
                    { status: "PENDING" },
                    { legalInfo: { businessVerificationStatus: { in: ["PENDING", "IN_REVIEW"] } } },
                ],
            },
        }),
        prisma.shop.count({
            where: {
                legalInfo: { businessVerificationStatus: "IN_REVIEW" },
            },
        }),
        prisma.shop.count({ where: { status: "ACTIVE" } }),
        prisma.shop.count({ where: { status: "SUSPENDED" } }),
        prisma.shop.count({
            where: {
                riskFlags: {
                    some: {
                        resolved: false,
                        severity: { in: ["HIGH", "CRITICAL"] },
                    },
                },
            },
        }),
    ]);

    return {
        shops,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        stats: {
            pendingCount,
            inReviewCount,
            activeCount,
            suspendedCount,
            highRiskCount,
        },
    };
};

export const getShopByIdAdmin = async (id: string) => {
    return prisma.shop.findUnique({
        where: { id },
        include: {
            owner: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    status: true,
                    isEmailVerified: true,
                    createdAt: true,
                    profile: true,
                },
            },
            profile: true,
            legalInfo: {
                include: {
                    documents: {
                        orderBy: { createdAt: "desc" },
                    },
                },
            },
            wallet: true,
            adminNotesList: {
                orderBy: { createdAt: "desc" },
            },
            riskFlags: {
                orderBy: { createdAt: "desc" },
            },
            _count: {
                select: {
                    products: true,
                    orders: true,
                    employees: true,
                    reviews: true,
                },
            },
        },
    });
};

export const updateShopStatusAdmin = async (id: string, status: string) => {
    return prisma.shop.update({ where: { id }, data: { status: status as any } });
};

export const approveShopAdmin = async (id: string, adminId: string, adminName: string, notes?: string) => {
    return prisma.$transaction(async (tx) => {
        const shop = await tx.shop.findUnique({
            where: { id },
            include: { legalInfo: true },
        });

        if (!shop) throw new Error("Shop not found");

        const updatedShop = await tx.shop.update({
            where: { id },
            data: {
                status: "ACTIVE",
                rejectionReason: null,
                rejectionNotes: null,
                rejectedAt: null,
                suspensionReason: null,
                suspensionNotes: null,
                suspendedAt: null,
                closureReason: null,
                closureNotes: null,
                closedAt: null,
                adminNotes: notes ? (shop.adminNotes ? `${notes}\n---\n${shop.adminNotes}` : notes) : shop.adminNotes,
            },
        });

        if (shop.legalInfo) {
            await tx.shopLegalInfo.update({
                where: { shopId: id },
                data: {
                    businessVerificationStatus: "VERIFIED",
                },
            });
        }

        await tx.shopAdminNote.create({
            data: {
                shopId: id,
                adminId,
                adminName,
                content: notes ? `Approved shop application. Note: ${notes}` : "Shop application approved and activated by Super Admin.",
            },
        });

        await tx.auditLog.create({
            data: {
                userId: adminId,
                action: "UPDATE",
                entity: "Shop",
                entityId: id,
                oldValue: { status: shop.status },
                newValue: { status: "ACTIVE", action: "APPROVE", notes },
            },
        });

        return updatedShop;
    });
};

export const rejectShopAdmin = async (
    id: string,
    adminId: string,
    adminName: string,
    reason: string,
    notes?: string
) => {
    return prisma.$transaction(async (tx) => {
        const shop = await tx.shop.findUnique({
            where: { id },
            include: { legalInfo: true },
        });

        if (!shop) throw new Error("Shop not found");

        const updatedShop = await tx.shop.update({
            where: { id },
            data: {
                status: "REJECTED",
                rejectionReason: reason,
                rejectionNotes: notes,
                rejectedAt: new Date(),
            },
        });

        if (shop.legalInfo) {
            await tx.shopLegalInfo.update({
                where: { shopId: id },
                data: {
                    businessVerificationStatus: "REJECTED",
                },
            });
        }

        await tx.shopAdminNote.create({
            data: {
                shopId: id,
                adminId,
                adminName,
                content: `Rejected shop application. Reason: ${reason}.${notes ? ` Notes: ${notes}` : ""}`,
            },
        });

        await tx.auditLog.create({
            data: {
                userId: adminId,
                action: "UPDATE",
                entity: "Shop",
                entityId: id,
                oldValue: { status: shop.status },
                newValue: { status: "REJECTED", reason, notes },
            },
        });

        return updatedShop;
    });
};

export const suspendShopAdmin = async (
    id: string,
    adminId: string,
    adminName: string,
    reason: string,
    notes?: string
) => {
    return prisma.$transaction(async (tx) => {
        const shop = await tx.shop.findUnique({ where: { id } });
        if (!shop) throw new Error("Shop not found");

        const updatedShop = await tx.shop.update({
            where: { id },
            data: {
                status: "SUSPENDED",
                suspensionReason: reason,
                suspensionNotes: notes,
                suspendedAt: new Date(),
            },
        });

        await tx.shopAdminNote.create({
            data: {
                shopId: id,
                adminId,
                adminName,
                content: `Suspended shop. Reason: ${reason}.${notes ? ` Notes: ${notes}` : ""}`,
            },
        });

        await tx.auditLog.create({
            data: {
                userId: adminId,
                action: "UPDATE",
                entity: "Shop",
                entityId: id,
                oldValue: { status: shop.status },
                newValue: { status: "SUSPENDED", reason, notes },
            },
        });

        return updatedShop;
    });
};

export const closeShopAdmin = async (
    id: string,
    adminId: string,
    adminName: string,
    reason: string,
    notes?: string
) => {
    return prisma.$transaction(async (tx) => {
        const shop = await tx.shop.findUnique({ where: { id } });
        if (!shop) throw new Error("Shop not found");

        const updatedShop = await tx.shop.update({
            where: { id },
            data: {
                status: "CLOSED",
                closureReason: reason,
                closureNotes: notes,
                closedAt: new Date(),
            },
        });

        await tx.shopAdminNote.create({
            data: {
                shopId: id,
                adminId,
                adminName,
                content: `Closed shop permanently. Reason: ${reason}.${notes ? ` Notes: ${notes}` : ""}`,
            },
        });

        await tx.auditLog.create({
            data: {
                userId: adminId,
                action: "UPDATE",
                entity: "Shop",
                entityId: id,
                oldValue: { status: shop.status },
                newValue: { status: "CLOSED", reason, notes },
            },
        });

        return updatedShop;
    });
};

export const reopenShopAdmin = async (
    id: string,
    adminId: string,
    adminName: string,
    reason: string,
    targetStatus: "ACTIVE" | "PENDING" = "ACTIVE"
) => {
    return prisma.$transaction(async (tx) => {
        const shop = await tx.shop.findUnique({ where: { id } });
        if (!shop) throw new Error("Shop not found");

        const updatedShop = await tx.shop.update({
            where: { id },
            data: {
                status: targetStatus,
                reopenedAt: new Date(),
                reopenReason: reason,
                suspensionReason: null,
                suspensionNotes: null,
                suspendedAt: null,
                closureReason: null,
                closureNotes: null,
                closedAt: null,
            },
        });

        await tx.shopAdminNote.create({
            data: {
                shopId: id,
                adminId,
                adminName,
                content: `Reopened shop to status ${targetStatus}. Reason: ${reason}`,
            },
        });

        await tx.auditLog.create({
            data: {
                userId: adminId,
                action: "UPDATE",
                entity: "Shop",
                entityId: id,
                oldValue: { status: shop.status },
                newValue: { status: targetStatus, action: "REOPEN", reason },
            },
        });

        return updatedShop;
    });
};

export const updateShopVerificationAdmin = async (
    shopId: string,
    adminId: string,
    adminName: string,
    data: {
        businessVerificationStatus?: any;
        taxIdStatus?: any;
        taxIdNotes?: string;
        registeredAddress?: string;
        addressVerificationStatus?: any;
        addressVerificationNotes?: string;
        ownerKycStatus?: any;
        ownerIdType?: string;
        ownerIdNumber?: string;
        ownerIdCardFront?: string;
        ownerIdCardBack?: string;
        ownerKycNotes?: string;
    }
) => {
    return prisma.$transaction(async (tx) => {
        let legalInfo = await tx.shopLegalInfo.findUnique({ where: { shopId } });
        if (!legalInfo) {
            legalInfo = await tx.shopLegalInfo.create({
                data: {
                    shopId,
                    legalBusinessName: "Pending Verification",
                    taxId: "PENDING",
                    entityType: "unspecified",
                },
            });
        }

        const updateData: any = {};
        if (data.businessVerificationStatus) updateData.businessVerificationStatus = data.businessVerificationStatus;
        if (data.taxIdStatus) {
            updateData.taxIdStatus = data.taxIdStatus;
            if (data.taxIdStatus === "VERIFIED") updateData.taxIdVerifiedAt = new Date();
        }
        if (data.taxIdNotes !== undefined) updateData.taxIdNotes = data.taxIdNotes;

        if (data.registeredAddress !== undefined) updateData.registeredAddress = data.registeredAddress;
        if (data.addressVerificationStatus) {
            updateData.addressVerificationStatus = data.addressVerificationStatus;
            if (data.addressVerificationStatus === "VERIFIED") updateData.addressVerifiedAt = new Date();
        }
        if (data.addressVerificationNotes !== undefined) updateData.addressVerificationNotes = data.addressVerificationNotes;

        if (data.ownerKycStatus) {
            updateData.ownerKycStatus = data.ownerKycStatus;
            if (data.ownerKycStatus === "VERIFIED") updateData.ownerKycVerifiedAt = new Date();
        }
        if (data.ownerIdType !== undefined) updateData.ownerIdType = data.ownerIdType;
        if (data.ownerIdNumber !== undefined) updateData.ownerIdNumber = data.ownerIdNumber;
        if (data.ownerIdCardFront !== undefined) updateData.ownerIdCardFront = data.ownerIdCardFront;
        if (data.ownerIdCardBack !== undefined) updateData.ownerIdCardBack = data.ownerIdCardBack;
        if (data.ownerKycNotes !== undefined) updateData.ownerKycNotes = data.ownerKycNotes;

        const updated = await tx.shopLegalInfo.update({
            where: { shopId },
            data: updateData,
        });

        await tx.shopAdminNote.create({
            data: {
                shopId,
                adminId,
                adminName,
                content: `Updated verification details: ${Object.keys(data).filter(k => (data as any)[k] !== undefined).join(", ")}`,
            },
        });

        await tx.auditLog.create({
            data: {
                userId: adminId,
                action: "UPDATE",
                entity: "ShopLegalInfo",
                entityId: legalInfo.id,
                newValue: updateData,
            },
        });

        return updated;
    });
};

export const addShopLegalDocumentAdmin = async (
    shopId: string,
    data: {
        type: any;
        name: string;
        fileUrl: string;
        fileSize?: number;
        mimeType?: string;
    }
) => {
    return prisma.$transaction(async (tx) => {
        let legalInfo = await tx.shopLegalInfo.findUnique({ where: { shopId } });
        if (!legalInfo) {
            legalInfo = await tx.shopLegalInfo.create({
                data: {
                    shopId,
                    legalBusinessName: "Pending Verification",
                    taxId: "PENDING",
                    entityType: "unspecified",
                },
            });
        }

        return tx.shopLegalDocument.create({
            data: {
                shopLegalInfoId: legalInfo.id,
                type: data.type || "OTHER",
                name: data.name,
                fileUrl: data.fileUrl,
                fileSize: data.fileSize,
                mimeType: data.mimeType,
                status: "PENDING",
            },
        });
    });
};

export const updateShopLegalDocumentStatusAdmin = async (
    documentId: string,
    status: any,
    rejectionReason?: string,
    notes?: string
) => {
    return prisma.shopLegalDocument.update({
        where: { id: documentId },
        data: {
            status,
            rejectionReason: status === "REJECTED" ? rejectionReason : null,
            notes,
            verifiedAt: status === "VERIFIED" ? new Date() : null,
        },
    });
};

export const deleteShopLegalDocumentAdmin = async (documentId: string) => {
    return prisma.shopLegalDocument.delete({
        where: { id: documentId },
    });
};

export const addShopAdminNoteAdmin = async (
    shopId: string,
    adminId: string,
    adminName: string,
    content: string
) => {
    const note = await prisma.shopAdminNote.create({
        data: {
            shopId,
            adminId,
            adminName,
            content,
        },
    });

    await prisma.shop.update({
        where: { id: shopId },
        data: { adminNotes: content },
    });

    return note;
};

export const addShopRiskFlagAdmin = async (
    shopId: string,
    data: {
        flag: string;
        severity?: any;
        description?: string;
    }
) => {
    return prisma.shopRiskFlag.create({
        data: {
            shopId,
            flag: data.flag,
            severity: data.severity || "MEDIUM",
            description: data.description,
        },
    });
};

export const resolveShopRiskFlagAdmin = async (
    flagId: string,
    adminName: string,
    notes?: string
) => {
    const existing = await prisma.shopRiskFlag.findUnique({ where: { id: flagId } });
    if (!existing) throw new Error("Risk flag not found");

    return prisma.shopRiskFlag.update({
        where: { id: flagId },
        data: {
            resolved: true,
            resolvedAt: new Date(),
            resolvedBy: adminName,
            description: notes ? `${existing.description || ""} [Resolved: ${notes}]` : existing.description,
        },
    });
};

export const listShipmentsAdmin = async (filters: { status?: string; search?: string; page?: number; limit?: number }) => {
    const { status, search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;
    const where: any = {
        shipment: { isNot: null },
        ...(status ? { status: status as any } : {}),
        ...(search ? { OR: [
            { id: { contains: search, mode: "insensitive" } },
            { shop: { profile: { name: { contains: search, mode: "insensitive" } } } },
            { shipment: { trackingNumber: { contains: search, mode: "insensitive" } } },
        ] } : {}),
    };

    const [shipments, total, pending, shipped, delivered] = await Promise.all([
        prisma.order.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" }, select: {
            id: true, status: true, createdAt: true, totalAmount: true,
            shop: { select: { id: true, slug: true, profile: { select: { name: true } } } },
            customer: { select: { name: true, email: true } },
            shipment: { select: { method: true, fee: true, carrier: true, trackingNumber: true, trackingUrl: true, estimatedDeliveryEnd: true, shippedAt: true, deliveredAt: true } },
        }}),
        prisma.order.count({ where }),
        prisma.order.count({ where: { shipment: { isNot: null }, status: { in: ["PENDING", "CONFIRMED", "PROCESSING"] } } }),
        prisma.order.count({ where: { shipment: { isNot: null }, status: "SHIPPED" } }),
        prisma.order.count({ where: { shipment: { isNot: null }, status: "DELIVERED" } }),
    ]);
    return { shipments, total, page, limit, totalPages: Math.ceil(total / limit), stats: { pending, shipped, delivered } };
};

export const listReturnsAdmin = async (filters: { status?: string; search?: string; resolution?: string; page?: number; limit?: number }) => {
    const { status, search, resolution, page = 1, limit = 20 } = filters;
    const baseWhere: any = {
        ...(resolution && resolution !== "ALL" ? { resolution } : {}),
        ...(search ? {
            OR: [
                { id: { contains: search, mode: "insensitive" } },
                { orderId: { contains: search, mode: "insensitive" } },
                { order: { customer: { name: { contains: search, mode: "insensitive" } } } },
                { order: { customer: { email: { contains: search, mode: "insensitive" } } } },
                { order: { shop: { profile: { name: { contains: search, mode: "insensitive" } } } } },
                { order: { shop: { slug: { contains: search, mode: "insensitive" } } } },
            ],
        } : {}),
    };

    let statusCondition: any = undefined;
    if (status && status !== "ALL") {
        if (status === "NEEDS_REVIEW") {
            statusCondition = { in: ["REQUESTED", "UNDER_REVIEW"] };
        } else if (status === "REFUNDED") {
            statusCondition = { in: ["REFUNDED", "REFUND_PENDING"] };
        } else if (status === "REJECTED") {
            statusCondition = { in: ["REJECTED", "CLOSED"] };
        } else if (status.includes(",")) {
            statusCondition = { in: status.split(",").map((s) => s.trim()).filter(Boolean) };
        } else {
            statusCondition = status;
        }
    }

    const where: any = {
        ...baseWhere,
        ...(statusCondition ? { status: statusCondition } : {}),
    };
    const [returns, total, statusCounts] = await prisma.$transaction([
        prisma.returnRequest.findMany({ where, include: adminReturnInclude, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
        prisma.returnRequest.count({ where }),
        prisma.returnRequest.groupBy({ by: ["status"], where: baseWhere, _count: { _all: true } }),
    ]);
    return {
        returns,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        statusCounts: Object.fromEntries(statusCounts.map((entry) => [entry.status, entry._count._all])),
    };
};

export const getReturnAdmin = async (id: string) =>
    prisma.returnRequest.findUnique({ where: { id }, include: adminReturnInclude });

export const updateReturnStatusAdmin = async (
    id: string,
    status: string,
    note?: string
) => {
    return prisma.$transaction(async (tx) => {
        const current = await tx.returnRequest.findUnique({
            where: { id },
            select: { id: true, status: true, orderId: true },
        });
        if (!current) return null;

        await tx.returnStatusHistory.create({
            data: {
                returnRequestId: id,
                status: status as any,
                note: note || `Return status updated to ${status} by administrator.`,
            },
        });

        return tx.returnRequest.update({
            where: { id },
            data: {
                status: status as any,
                adminNote: note,
                resolvedAt: ["REJECTED", "CLOSED", "REFUNDED"].includes(status) ? new Date() : undefined,
            },
            include: adminReturnInclude,
        });
    });
};

export const setReturnRefundPendingAdmin = async (id: string) =>
    prisma.$transaction(async (tx) => {
        const request = await tx.returnRequest.findUnique({ where: { id }, select: { status: true } });
        if (!request) return null;
        if (!["APPROVED", "ITEM_RECEIVED", "REQUESTED", "UNDER_REVIEW", "REFUND_PENDING"].includes(request.status)) {
            throw new Error(`Return with status ${request.status} cannot be refunded.`);
        }
        await tx.returnStatusHistory.create({
            data: { returnRequestId: id, status: "REFUND_PENDING", note: "Refund approved & initiated by platform administrator." },
        });
        return tx.returnRequest.update({ where: { id }, data: { status: "REFUND_PENDING" }, include: adminReturnInclude });
    });

// ─────────────────────────────────────────────
// REVIEWS
// ─────────────────────────────────────────────
export const listReviewsAdmin = async (filters: {
    search?: string;
    rating?: number;
    isVisible?: boolean;
    shopId?: string;
    page?: number;
    limit?: number;
}) => {
    const { search, rating, isVisible, shopId, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
        ...(typeof isVisible === "boolean" ? { isVisible } : {}),
        ...(rating && !isNaN(rating) ? { rating } : {}),
        ...(shopId ? { shopId } : {}),
        ...(search
            ? {
                  OR: [
                      { comment: { contains: search, mode: "insensitive" } },
                      { product: { name: { contains: search, mode: "insensitive" } } },
                      { user: { name: { contains: search, mode: "insensitive" } } },
                      { user: { email: { contains: search, mode: "insensitive" } } },
                  ],
              }
            : {}),
    };

    const [reviews, total, allReviews] = await Promise.all([
        prisma.review.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        images: { take: 1, orderBy: { isPrimary: "desc" }, select: { url: true } },
                    },
                },
                shop: {
                    select: {
                        id: true,
                        slug: true,
                        profile: { select: { name: true } },
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                reply: true,
            },
        }),
        prisma.review.count({ where }),
        prisma.review.findMany({
            where: shopId ? { shopId } : undefined,
            select: { rating: true, isVisible: true },
        }),
    ]);

    const totalPlatformReviews = allReviews.length;
    const visibleCount = allReviews.filter((r) => r.isVisible).length;
    const hiddenCount = totalPlatformReviews - visibleCount;
    const avgRating =
        totalPlatformReviews > 0
            ? Number((allReviews.reduce((sum, r) => sum + r.rating, 0) / totalPlatformReviews).toFixed(1))
            : 0;

    return {
        reviews,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        stats: {
            totalPlatformReviews,
            visibleCount,
            hiddenCount,
            avgRating,
        },
    };
};

export const updateReviewVisibilityAdmin = async (id: string, isVisible: boolean) => {
    return prisma.review.update({
        where: { id },
        data: { isVisible },
        select: { id: true, isVisible: true },
    });
};

export const deleteReviewAdmin = async (id: string) => {
    await prisma.reviewReply.deleteMany({ where: { reviewId: id } });
    return prisma.review.delete({
        where: { id },
    });
};

// ─────────────────────────────────────────────
// ORDERS (ADMIN)
// ─────────────────────────────────────────────
export const listOrdersAdmin = async (filters: {
    status?: string;
    shopId?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
}) => {
    const { status, shopId, search, dateFrom, dateTo, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
        ...(status && { status: status as any }),
        ...(shopId && { shopId }),
        ...((dateFrom || dateTo) ? {
            createdAt: {
                ...(dateFrom && { gte: new Date(dateFrom) }),
                ...(dateTo && { lte: new Date(dateTo) }),
            },
        } : {}),
        ...(search && {
            OR: [
                { customer: { name: { contains: search, mode: "insensitive" } } },
                { customer: { email: { contains: search, mode: "insensitive" } } },
                { id: { contains: search, mode: "insensitive" } },
            ],
        }),
    };

    const [orders, total] = await Promise.all([
        prisma.order.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                status: true,
                totalAmount: true,
                discountAmount: true,
                createdAt: true,
                customer: { select: { id: true, name: true, email: true } },
                shop: { select: { id: true, slug: true, profile: { select: { name: true } } } },
                _count: { select: { items: true } },
            },
        }),
        prisma.order.count({ where }),
    ]);

    return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getOrderByIdAdmin = async (id: string) => {
    return prisma.order.findUnique({
        where: { id },
        include: {
            customer: { select: { id: true, name: true, email: true } },
            shop: { select: { id: true, slug: true, profile: { select: { name: true, logo: true } } } },
            items: {
                include: {
                    product: { select: { id: true, name: true, images: { where: { isPrimary: true }, select: { url: true }, take: 1 } } },
                    variant: { select: { id: true, name: true } },
                },
            },
            shipment: true,
            coupon: { select: { id: true, code: true, type: true, value: true } },
        },
    });
};

export interface OrderAnalyticsFilters {
    shopId?: string;
    dateFrom?: string;
    dateTo?: string;
    range?: "7d" | "30d" | "90d" | "12m" | "all";
}

export const getOrderAnalyticsAdmin = async (filters: OrderAnalyticsFilters = {}) => {
    const { shopId, dateFrom, dateTo, range } = filters;

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (dateFrom) {
        startDate = new Date(dateFrom);
        if (!isNaN(startDate.getTime())) {
            startDate.setHours(0, 0, 0, 0);
        } else {
            startDate = undefined;
        }
    }
    if (dateTo) {
        endDate = new Date(dateTo);
        if (!isNaN(endDate.getTime())) {
            endDate.setHours(23, 59, 59, 999);
        } else {
            endDate = undefined;
        }
    }

    if (!startDate && !endDate && range && range !== "all") {
        endDate = new Date();
        startDate = new Date();
        if (range === "7d") {
            startDate.setDate(endDate.getDate() - 6);
        } else if (range === "30d") {
            startDate.setDate(endDate.getDate() - 29);
        } else if (range === "90d") {
            startDate.setDate(endDate.getDate() - 89);
        } else if (range === "12m") {
            startDate.setFullYear(endDate.getFullYear() - 1);
        }
        startDate.setHours(0, 0, 0, 0);
    }

    const where: any = {
        deletedAt: null,
        ...(shopId ? { shopId } : {}),
        ...((startDate || endDate) ? {
            createdAt: {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {}),
            },
        } : {}),
    };

    const [ordersByStatus, totalOrders, returnedOrdersCount, allValidOrders, topShopsRaw, ordersWithAddress] = await Promise.all([
        prisma.order.groupBy({
            by: ["status"],
            where,
            _count: { _all: true },
            _sum: { totalAmount: true },
        }),
        prisma.order.count({ where }),
        prisma.returnRequest.count({
            where: {
                ...(shopId ? { order: { shopId } } : {}),
                ...((startDate || endDate) ? {
                    createdAt: {
                        ...(startDate ? { gte: startDate } : {}),
                        ...(endDate ? { lte: endDate } : {}),
                    },
                } : {}),
            },
        }),
        prisma.order.findMany({
            where: {
                ...where,
                status: { in: ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] },
            },
            select: { totalAmount: true },
        }),
        prisma.order.groupBy({
            by: ["shopId"],
            where,
            _count: { _all: true },
            _sum: { totalAmount: true },
        }),
        prisma.order.findMany({
            where: {
                ...where,
                shippingAddress: { isNot: null },
            },
            select: {
                totalAmount: true,
                shippingAddress: {
                    select: { country: true, city: true },
                },
            },
        }),
    ]);

    const statusMap: Record<string, number> = {};
    const statusRevenueMap: Record<string, number> = {};
    for (const item of ordersByStatus) {
        statusMap[item.status] = item._count._all;
        statusRevenueMap[item.status] = Number(item._sum.totalAmount || 0);
    }

    const pendingOrders = statusMap["PENDING"] || 0;
    const processingOrders = (statusMap["PROCESSING"] || 0) + (statusMap["CONFIRMED"] || 0);
    const shippedOrders = statusMap["SHIPPED"] || 0;
    const deliveredOrders = statusMap["DELIVERED"] || 0;
    const cancelledOrders = (statusMap["CANCELLED"] || 0) + (statusMap["EXPIRED"] || 0);
    const refundedOrders = statusMap["REFUNDED"] || 0;
    const returnedOrders = returnedOrdersCount || refundedOrders;

    const grossRevenue = allValidOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const refundedAmount = statusRevenueMap["REFUNDED"] || 0;
    const netRevenue = Math.max(0, grossRevenue - refundedAmount);

    const validOrdersCount = allValidOrders.length;
    const averageOrderValue = validOrdersCount > 0 ? Number((grossRevenue / validOrdersCount).toFixed(2)) : 0;
    const orderCancellationRate = totalOrders > 0 ? Number(((cancelledOrders / totalOrders) * 100).toFixed(1)) : 0;
    const orderFulfillmentRate = totalOrders > 0 ? Number(((deliveredOrders / totalOrders) * 100).toFixed(1)) : 100;

    // 2. Orders by Shop
    const sortedTopShops = [...topShopsRaw]
        .sort((a, b) => (b._count._all || 0) - (a._count._all || 0))
        .slice(0, 10);
    const shopIds = sortedTopShops.map((s) => s.shopId);
    const shopProfiles = await prisma.shop.findMany({
        where: { id: { in: shopIds } },
        select: { id: true, slug: true, profile: { select: { name: true, logo: true } } },
    });
    const shopMap = new Map(shopProfiles.map((s) => [s.id, s]));
    const ordersByShop = sortedTopShops.map((s) => {
        const sh = shopMap.get(s.shopId);
        return {
            shopId: s.shopId,
            shopName: sh?.profile?.name || sh?.slug || s.shopId,
            shopSlug: sh?.slug || "",
            logo: sh?.profile?.logo || null,
            count: s._count._all,
            revenue: Number(Number(s._sum.totalAmount || 0).toFixed(2)),
            percentage: totalOrders > 0 ? Number(((s._count._all / totalOrders) * 100).toFixed(1)) : 0,
        };
    });

    // 3. Orders by Geographical Location
    const locationMap = new Map<string, { country: string; city: string; count: number; revenue: number }>();
    for (const o of ordersWithAddress) {
        const country = o.shippingAddress?.country || "Direct";
        const city = o.shippingAddress?.city || "";
        const key = city ? `${city}, ${country}` : country;
        const existing = locationMap.get(key) || { country, city, count: 0, revenue: 0 };
        existing.count += 1;
        existing.revenue += Number(o.totalAmount || 0);
        locationMap.set(key, existing);
    }
    const ordersByLocation = Array.from(locationMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map((loc) => ({
            country: loc.country,
            city: loc.city,
            location: loc.city ? `${loc.city}, ${loc.country}` : loc.country,
            count: loc.count,
            revenue: Number(loc.revenue.toFixed(2)),
            percentage: totalOrders > 0 ? Number(((loc.count / totalOrders) * 100).toFixed(1)) : 0,
        }));

    // 4. Orders Over Time (Timeline points)
    const ordersForTimeline = await prisma.order.findMany({
        where,
        select: {
            createdAt: true,
            totalAmount: true,
            status: true,
        },
        orderBy: { createdAt: "asc" },
    });

    const spanDays = startDate && endDate
        ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        : 30;

    const useMonthly = spanDays > 120;
    const timeMap = new Map<string, { label: string; date: string; orders: number; revenue: number; netRevenue: number; delivered: number; shippedDelivered: number; cancelled: number }>();

    for (const o of ordersForTimeline) {
        const d = o.createdAt;
        const key = useMonthly
            ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
            : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

        const label = useMonthly
            ? d.toLocaleString("en-US", { month: "short", year: "2-digit" })
            : d.toLocaleString("en-US", { month: "short", day: "numeric" });

        const existing = timeMap.get(key) || { label, date: key, orders: 0, revenue: 0, netRevenue: 0, delivered: 0, shippedDelivered: 0, cancelled: 0 };
        existing.orders += 1;
        existing.revenue += Number(o.totalAmount || 0);
        if (o.status === "DELIVERED") existing.delivered += 1;
        if (o.status === "SHIPPED" || o.status === "DELIVERED") existing.shippedDelivered += 1;
        if (o.status === "CANCELLED" || o.status === "EXPIRED") existing.cancelled += 1;
        if (o.status !== "CANCELLED" && o.status !== "EXPIRED" && o.status !== "REFUNDED") existing.netRevenue += Number(o.totalAmount || 0);
        timeMap.set(key, existing);
    }

    const ordersOverTime = Array.from(timeMap.values()).map((pt) => ({
        ...pt,
        revenue: Number(pt.revenue.toFixed(2)),
        netRevenue: Number(pt.netRevenue.toFixed(2)),
    }));

    return {
        totalOrders,
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        returnedOrders,
        grossRevenue: Number(grossRevenue.toFixed(2)),
        netRevenue: Number(netRevenue.toFixed(2)),
        refundedAmount: Number(refundedAmount.toFixed(2)),
        averageOrderValue,
        orderCancellationRate,
        orderFulfillmentRate,
        ordersOverTime,
        ordersByShop,
        ordersByLocation,
        ordersByStatus: Object.entries(statusMap).map(([status, count]) => ({
            status,
            count,
            percentage: totalOrders > 0 ? Number(((count / totalOrders) * 100).toFixed(1)) : 0,
        })),
    };
};

// ─────────────────────────────────────────────
// ANALYTICS (ADMIN)
// ─────────────────────────────────────────────
export const getPlatformAnalytics = async () => {
    const historicalStartDate = new Date();
    historicalStartDate.setMonth(historicalStartDate.getMonth() - 24);

    const [gmvResult, ordersByStatus, topShops, userGrowth, ordersByMonth] = await Promise.all([
        prisma.order.aggregate({ _sum: { totalAmount: true } }),
        prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
        prisma.order.groupBy({
            by: ["shopId"],
            _sum: { totalAmount: true },
            _count: { _all: true },
            orderBy: { _sum: { totalAmount: "desc" } },
            take: 10,
        }),
        prisma.$queryRaw<{ month: string; count: bigint }[]>`
            WITH months AS (
                SELECT generate_series(
                    date_trunc('month', ${historicalStartDate}),
                    date_trunc('month', CURRENT_DATE),
                    interval '1 month'
                ) AS month_start
            )
            SELECT TO_CHAR(months.month_start, 'YYYY-MM') AS month,
                   COUNT("User"."id") AS count
            FROM months
            LEFT JOIN "User"
                ON "User"."createdAt" >= months.month_start
                AND "User"."createdAt" < months.month_start + interval '1 month'
            GROUP BY months.month_start
            ORDER BY months.month_start ASC
        `,
        prisma.$queryRaw<{ month: string; count: bigint; revenue: number }[]>`
            WITH months AS (
                SELECT generate_series(
                    date_trunc('month', ${historicalStartDate}),
                    date_trunc('month', CURRENT_DATE),
                    interval '1 month'
                ) AS month_start
            )
            SELECT TO_CHAR(months.month_start, 'YYYY-MM') AS month,
                   COUNT("Order"."id") AS count,
                   COALESCE(SUM("Order"."totalAmount"), 0) AS revenue
            FROM months
            LEFT JOIN "Order"
                ON "Order"."createdAt" >= months.month_start
                AND "Order"."createdAt" < months.month_start + interval '1 month'
            GROUP BY months.month_start
            ORDER BY months.month_start ASC
        `,
    ]);

    const shopIds = topShops.map((s) => s.shopId);
    const shopProfiles = await prisma.shop.findMany({
        where: { id: { in: shopIds } },
        select: { id: true, slug: true, profile: { select: { name: true } } },
    });
    const shopMap = Object.fromEntries(shopProfiles.map((s) => [s.id, s]));

    return {
        gmv: Number(gmvResult._sum.totalAmount ?? 0),
        ordersByStatus: ordersByStatus.map((s) => ({ status: s.status, count: s._count._all })),
        topShops: topShops.map((s) => ({
            shopId: s.shopId,
            shopName: shopMap[s.shopId]?.profile?.name ?? shopMap[s.shopId]?.slug ?? s.shopId,
            revenue: Number(s._sum.totalAmount ?? 0),
            orderCount: s._count._all,
        })),
        userGrowth: userGrowth.map((r) => ({ month: r.month, count: Number(r.count) })),
        ordersByMonth: ordersByMonth.map((r) => ({ month: r.month, count: Number(r.count), revenue: Number(r.revenue) })),
    };
};

// ─────────────────────────────────────────────
// PAYOUTS (ADMIN)
// ─────────────────────────────────────────────
export const listPayoutsAdmin = async (filters: {
    search?: string;
    filter?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
}) => {
    const { search, filter, sortBy = "balance_desc", page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
        status: { not: "CLOSED" },
        ...(search
            ? {
                  OR: [
                      { slug: { contains: search, mode: "insensitive" } },
                      { profile: { name: { contains: search, mode: "insensitive" } } },
                      { owner: { name: { contains: search, mode: "insensitive" } } },
                      { owner: { email: { contains: search, mode: "insensitive" } } },
                  ],
              }
            : {}),
    };

    if (filter === "WITH_BALANCE") {
        where.wallet = { balance: { gt: 0 } };
    } else if (filter === "ZERO_BALANCE") {
        where.wallet = { balance: { lte: 0 } };
    } else if (filter === "STRIPE_CONNECTED") {
        where.wallet = { stripeAccountId: { not: null }, payoutsEnabled: true };
    } else if (filter === "STRIPE_PENDING") {
        where.wallet = { OR: [{ stripeAccountId: null }, { payoutsEnabled: false }] };
    }

    let orderBy: any = { createdAt: "desc" };
    if (sortBy === "balance_desc") {
        orderBy = { wallet: { balance: "desc" } };
    } else if (sortBy === "balance_asc") {
        orderBy = { wallet: { balance: "asc" } };
    } else if (sortBy === "name") {
        orderBy = { slug: "asc" };
    } else if (sortBy === "newest") {
        orderBy = { createdAt: "desc" };
    }

    const [shops, total] = await Promise.all([
        prisma.shop.findMany({
            skip,
            take: limit,
            orderBy,
            where,
            select: {
                id: true,
                slug: true,
                status: true,
                createdAt: true,
                owner: { select: { id: true, name: true, email: true } },
                profile: { select: { name: true, logo: true } },
                wallet: {
                    select: {
                        id: true,
                        balance: true,
                        stripeAccountId: true,
                        payoutsEnabled: true,
                        updatedAt: true,
                    },
                },
                walletTransactions: {
                    orderBy: { createdAt: "desc" },
                    take: 10,
                    select: {
                        id: true,
                        type: true,
                        amount: true,
                        balanceAfter: true,
                        note: true,
                        createdAt: true,
                        orderId: true,
                    },
                },
            },
        }),
        prisma.shop.count({ where }),
    ]);

    return { shops, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getPayoutsSummary = async () => {
    const [walletAgg, shopsWithBalance, totalDebits, platformWallet, settledOrdersAgg, stripeConnectedCount, totalShopWallets] = await Promise.all([
        prisma.shopWallet.aggregate({ _sum: { balance: true } }),
        prisma.shopWallet.count({ where: { balance: { gt: 0 } } }),
        prisma.walletTransaction.aggregate({ where: { type: "DEBIT" }, _sum: { amount: true } }),
        prisma.platformWallet.findFirst(),
        prisma.order.aggregate({
            where: { status: { in: ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] } },
            _sum: { totalAmount: true },
        }),
        prisma.shopWallet.count({ where: { stripeAccountId: { not: null }, payoutsEnabled: true } }),
        prisma.shopWallet.count(),
    ]);

    const grossVolume = Number(settledOrdersAgg?._sum?.totalAmount ?? 0);
    const calculated10PctCommission = Math.round(grossVolume * 0.10 * 100) / 100;
    const recordedWalletBalance = platformWallet ? Number(platformWallet.balance) : 0;
    const effectivePlatformBalance = Math.max(recordedWalletBalance, calculated10PctCommission);

    return {
        totalPlatformBalance: effectivePlatformBalance,
        totalShopBalance: Number(walletAgg._sum.balance ?? 0),
        shopsWithBalance,
        totalWithdrawn: Number(totalDebits._sum.amount ?? 0),
        stripeConnectedCount,
        totalShopWallets,
    };
};

// ─────────────────────────────────────────────
// BILLING OVERVIEW (ADMIN)
// ─────────────────────────────────────────────
export const getBillingOverview = async () => {
    const shops = await prisma.shop.findMany({
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            slug: true,
            status: true,
            createdAt: true,
            owner: { select: { id: true, name: true, email: true } },
            profile: { select: { name: true, logo: true } },
            wallet: { select: { balance: true } },
            membership: { select: { status: true, expiresAt: true, plan: { select: { name: true, price: true, billingCycle: true } } } },
            _count: { select: { products: true, orders: true } },
        },
    });

    const totalActive = shops.filter((s) => s.status === "ACTIVE").length;
    const totalSuspended = shops.filter((s) => s.status === "SUSPENDED").length;

    return { shops, totalActive, totalSuspended };
};

// ─────────────────────────────────────────────
// AUDIT LOGS (ADMIN)
// ─────────────────────────────────────────────
export const listAuditLogsAdmin = async (filters: {
    userId?: string;
    entity?: string;
    action?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    page?: number;
    limit?: number;
}) => {
    const { userId, entity, action, dateFrom, dateTo, search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
        ...(userId && { userId }),
        ...(entity && { entity: { contains: entity, mode: "insensitive" } }),
        ...(action && { action: action as any }),
        ...((dateFrom || dateTo) ? {
            createdAt: {
                ...(dateFrom && { gte: new Date(dateFrom) }),
                ...(dateTo && { lte: new Date(dateTo) }),
            },
        } : {}),
        ...(search && {
            OR: [
                { user: { name: { contains: search, mode: "insensitive" } } },
                { user: { email: { contains: search, mode: "insensitive" } } },
                { entity: { contains: search, mode: "insensitive" } },
                { entityId: { contains: search, mode: "insensitive" } },
            ],
        }),
    };

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: { user: { select: { id: true, name: true, email: true } } },
        }),
        prisma.auditLog.count({ where }),
    ]);

    return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
};

// ─────────────────────────────────────────────
// COUPONS (ADMIN)
// ─────────────────────────────────────────────
export const listCouponsAdmin = async (filters: {
    shopId?: string;
    isActive?: boolean;
    type?: string;
    search?: string;
    page?: number;
    limit?: number;
}) => {
    const { shopId, isActive, type, search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
        ...(shopId && { shopId }),
        ...(typeof isActive === "boolean" && { isActive }),
        ...(type && { type: type as any }),
        ...(search && {
            OR: [
                { code: { contains: search, mode: "insensitive" } },
                { shop: { profile: { name: { contains: search, mode: "insensitive" } } } },
                { shop: { slug: { contains: search, mode: "insensitive" } } },
            ],
        }),
    };

    const now = new Date();
    const [coupons, total, totalCount, activeCount, expiredCount, percentageCount, fixedCount, usageAgg] = await Promise.all([
        prisma.coupon.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                shop: { select: { id: true, slug: true, profile: { select: { name: true } } } },
                _count: { select: { usages: true } },
            },
        }),
        prisma.coupon.count({ where }),
        prisma.coupon.count(),
        prisma.coupon.count({ where: { isActive: true, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] } }),
        prisma.coupon.count({ where: { expiresAt: { lte: now } } }),
        prisma.coupon.count({ where: { type: "PERCENTAGE" } }),
        prisma.coupon.count({ where: { type: "FIXED_AMOUNT" } }),
        prisma.coupon.aggregate({ _sum: { usedCount: true } }),
    ]);

    return {
        coupons,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        stats: {
            total: totalCount,
            active: activeCount,
            expired: expiredCount,
            percentage: percentageCount,
            fixed: fixedCount,
            totalRedemptions: usageAgg._sum.usedCount || 0,
        },
    };
};

export const toggleCouponAdmin = async (id: string) => {
    const coupon = await prisma.coupon.findUnique({ where: { id }, select: { isActive: true } });
    if (!coupon) return null;
    return prisma.coupon.update({ where: { id }, data: { isActive: !coupon.isActive }, select: { id: true, isActive: true } });
};

// ─────────────────────────────────────────────
// PRODUCTS (ADMIN)
// ─────────────────────────────────────────────
export const listProductsAdmin = async (filters: {
    search?: string;
    status?: string;
    shopId?: string;
    platformCategoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    page?: number;
    limit?: number;
}) => {
    const {
        search,
        status,
        shopId,
        platformCategoryId,
        minPrice,
        maxPrice,
        inStock,
        page = 1,
        limit = 20,
    } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
        deletedAt: null,
        ...(status && { status: status as any }),
        ...(shopId && { shopId }),
        ...(platformCategoryId && { platformCategoryId }),
        ...((minPrice !== undefined || maxPrice !== undefined) && {
            basePrice: {
                ...(minPrice !== undefined && { gte: minPrice }),
                ...(maxPrice !== undefined && { lte: maxPrice }),
            },
        }),
        ...(inStock !== undefined && (inStock ? { stock: { gt: 0 } } : { stock: { lte: 0 } })),
        ...(search && {
            OR: [
                { name: { contains: search, mode: "insensitive" } },
                { sku: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                { shop: { slug: { contains: search, mode: "insensitive" } } },
                { shop: { profile: { name: { contains: search, mode: "insensitive" } } } },
            ],
        }),
    };

    const [products, total, totalCount, activeCount, draftCount, archivedCount, outOfStockCount] =
        await Promise.all([
            prisma.product.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    shop: {
                        select: {
                            id: true,
                            slug: true,
                            profile: { select: { name: true, logo: true } },
                            owner: { select: { id: true, name: true, email: true } },
                        },
                    },
                    platformCategory: { select: { id: true, name: true } },
                    images: { orderBy: { isPrimary: "desc" }, select: { id: true, url: true, isPrimary: true } },
                    _count: { select: { variants: true, reviews: true, orderItems: true } },
                },
            }),
            prisma.product.count({ where }),
            prisma.product.count({ where: { deletedAt: null } }),
            prisma.product.count({ where: { deletedAt: null, status: "ACTIVE" } }),
            prisma.product.count({ where: { deletedAt: null, status: "DRAFT" } }),
            prisma.product.count({ where: { deletedAt: null, status: "ARCHIVED" } }),
            prisma.product.count({ where: { deletedAt: null, stock: { lte: 0 } } }),
        ]);

    return {
        products,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        stats: {
            total: totalCount,
            active: activeCount,
            draft: draftCount,
            archived: archivedCount,
            outOfStock: outOfStockCount,
        },
    };
};

export const getProductByIdAdmin = async (id: string) => {
    return prisma.product.findUnique({
        where: { id },
        include: {
            shop: {
                select: {
                    id: true,
                    slug: true,
                    profile: { select: { name: true, logo: true } },
                    owner: { select: { id: true, name: true, email: true } },
                },
            },
            platformCategory: { select: { id: true, name: true } },
            category: { select: { id: true, name: true } },
            images: { orderBy: { isPrimary: "desc" } },
            variants: { orderBy: { createdAt: "asc" } },
            reviews: {
                take: 5,
                orderBy: { createdAt: "desc" },
                include: { user: { select: { name: true, email: true } } },
            },
            _count: { select: { reviews: true, orderItems: true, wishlistItems: true } },
        },
    });
};

export const updateProductStatusAdmin = async (
    id: string,
    status: "ACTIVE" | "DRAFT" | "ARCHIVED",
    adminUserId?: string
) => {
    const existing = await prisma.product.findUnique({
        where: { id },
        select: { id: true, status: true, name: true, shopId: true },
    });
    if (!existing) return null;

    const updated = await prisma.product.update({
        where: { id },
        data: { status },
        select: { id: true, name: true, status: true, updatedAt: true },
    });

    if (adminUserId) {
        await prisma.auditLog.create({
            data: {
                userId: adminUserId,
                action: "UPDATE",
                entity: "PRODUCT",
                entityId: id,
                oldValue: { status: existing.status, name: existing.name },
                newValue: { status },
            },
        });
    }

    return updated;
};
