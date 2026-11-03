import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Prisma } from "@prisma/client";
import { reserveInventoryItem, getShopOrdersRepository } from "./order.repository.js";
import { prisma } from "../../config/db.js";

vi.mock("../../config/db.js", () => ({
    prisma: {
        order: {
            findMany: vi.fn(),
            count: vi.fn(),
        },
    },
}));

describe("reserveInventoryItem", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("allows only one concurrent reservation when one unit remains", async () => {
        const updateMany = vi
            .fn()
            .mockResolvedValueOnce({ count: 1 })
            .mockResolvedValueOnce({ count: 0 });
        const create = vi.fn().mockResolvedValue({});
        const tx = {
            productVariant: { updateMany },
            product: { updateMany: vi.fn() },
            inventoryReservation: { create },
        } as unknown as Prisma.TransactionClient;
        const item = {
            productId: "product_1",
            variantId: "variant_1",
            quantity: 1,
            productName: "Limited product",
        };

        const results = await Promise.allSettled([
            reserveInventoryItem(tx, item, "order_1", new Date()),
            reserveInventoryItem(tx, item, "order_2", new Date()),
        ]);

        expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
        expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
        expect(updateMany).toHaveBeenCalledTimes(2);
        expect(updateMany).toHaveBeenCalledWith({
            where: { id: "variant_1", stock: { gte: 1 } },
            data: { stock: { decrement: 1 } },
        });
        expect(create).toHaveBeenCalledTimes(1);
    });
});

describe("getShopOrdersRepository", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("applies search filter across customer name, email, order ID, and tracking number", async () => {
        const mockOrders = [{ id: "order_123", totalAmount: 100 }];
        (prisma.order.findMany as any).mockResolvedValue(mockOrders);
        (prisma.order.count as any).mockResolvedValue(1);

        const result = await getShopOrdersRepository({
            shopId: "shop_1",
            search: "Alice",
            skip: 0,
            take: 20,
        });

        expect(prisma.order.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    shopId: "shop_1",
                    deletedAt: null,
                    OR: [
                        { id: { contains: "Alice", mode: "insensitive" } },
                        { customer: { name: { contains: "Alice", mode: "insensitive" } } },
                        { customer: { email: { contains: "Alice", mode: "insensitive" } } },
                        { shippingAddress: { fullName: { contains: "Alice", mode: "insensitive" } } },
                        { shipment: { trackingNumber: { contains: "Alice", mode: "insensitive" } } },
                    ],
                }),
                skip: 0,
                take: 20,
            })
        );
        expect(result).toEqual({ orders: mockOrders, total: 1 });
    });

    it("applies date range filter for startDate and endDate", async () => {
        (prisma.order.findMany as any).mockResolvedValue([]);
        (prisma.order.count as any).mockResolvedValue(0);

        await getShopOrdersRepository({
            shopId: "shop_1",
            startDate: "2026-11-01",
            endDate: "2026-11-03",
            skip: 10,
            take: 10,
        });

        expect(prisma.order.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    shopId: "shop_1",
                    deletedAt: null,
                    createdAt: {
                        gte: expect.any(Date),
                        lte: expect.any(Date),
                    },
                }),
                skip: 10,
                take: 10,
            })
        );
    });
});
