import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPaymentIntentService } from "./payment.service.js";
import * as paymentRepository from "./payment.repository.js";

const { prisma } = vi.hoisted(() => ({
    prisma: {
        checkout: {
            findUnique: vi.fn(),
        },
    },
}));

vi.mock("../../config/db.js", () => ({ prisma }));
vi.mock("./payment.repository.js", () => ({
    createPaymentRecord: vi.fn(),
    findPaymentByCheckoutId: vi.fn(),
    findPaymentForRefund: vi.fn(),
    markPaymentFailed: vi.fn(),
    confirmPaymentWithEventLog: vi.fn(),
    confirmRefundWithEventLog: vi.fn(),
    updatePaymentProvider: vi.fn(),
    findPaymentByProviderId: vi.fn(),
    executeAdminRefundLedger: vi.fn(),
}));
vi.mock("../orders/order.repository.js", () => ({
    beginRefundRepository: vi.fn(),
    cancelRefundRepository: vi.fn(),
}));
vi.mock("../../infrastructure/queue/orderExpiration.helpers.js", () => ({
    cancelOrderExpiration: vi.fn(),
}));
vi.mock("../notification/notification.service.js", () => ({
    notifyUser: vi.fn(),
}));

describe("createPaymentIntentService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("does not allow a customer to pay another customer's checkout", async () => {
        prisma.checkout.findUnique.mockResolvedValue({
            id: "checkout_1",
            customerId: "customer_1",
            status: "PENDING",
            totalAmount: "25.00",
        });

        await expect(
            createPaymentIntentService("checkout_1", "customer_2"),
        ).rejects.toMatchObject({
            message: "Checkout not found.",
            statusCode: 404,
        });

        expect(paymentRepository.findPaymentByCheckoutId).not.toHaveBeenCalled();
        expect(paymentRepository.createPaymentRecord).not.toHaveBeenCalled();
    });

});
