import { OrderStatus } from "@prisma/client";
import { AppError } from "../../middleware/appError.js";
import { getCartWithItems, clearCart } from "../cart/cart.repository.js";
import { logger } from "../../config/logger.js";
import {
    cancelOrderRepository,
    createOrdersFromCart,
    findOrderForCancelRepository,
    getCustomerOrderByIdRepository,
    getCustomerOrdersRepository,
    getShopOrderByIdRepository,
    getShopOrdersRepository,
    updateOrderStatusRepository,
} from "./order.repository.js";
import { GetOrdersQuery, shipAddressInput } from "./order.types.js";
import { scheduleOrderExpiration } from "../../infrastructure/queue/orderExpiration.helpers.js";
import { notifyUser } from "../notification/notification.service.js";
import { renderOrderPlacedEmail } from "../../services/email.templates.js";

export const checkoutService = async (customerId: string, shippingAddress: shipAddressInput) => {
    const cart = await getCartWithItems(customerId);

    if (!cart || cart.items.length === 0) {
        throw new AppError("Your cart is empty.", 400);
    }

    // fitter to avaliable items only
    const availableItems = cart.items.filter((item) => {
        return item.product.status === "ACTIVE" && item.product.shop.status === "ACTIVE";
    });

    if (availableItems.length === 0) {
        throw new AppError("No avaliable item in cart.", 400);
    }

    // validate stock for all items befor creating anything

    for (const item of availableItems) {
        const avaliableStosk = item.variant ? item.variant.stock : item.product.stock;

        if (avaliableStosk < item.quantity) {
            throw new AppError(
                `Insufficint stock for ${item.product.name}.only ${avaliableStosk} available.`,
                400,
            );
        }
    }

    //  group available items by shopId

    const shopGroupMap: Record<
        string,
        {
            shopId: string;
            shopSlug: string;
            items: typeof availableItems;
        }
    > = {};

    for (const item of availableItems) {
        const shopId = item.product.shopId;

        if (!shopGroupMap[shopId]) {
            shopGroupMap[shopId] = {
                shopId,
                shopSlug: item.product.shop.slug,
                items: [],
            };
        }
        shopGroupMap[shopId].items.push(item);
    }

    const shopGroups = Object.values(shopGroupMap);

    //create all orders in one transaction
    const createdOrders = await createOrdersFromCart(customerId, shopGroups, shippingAddress);

    try {
        await Promise.all(createdOrders.map((order) => scheduleOrderExpiration(order.id)));
    } catch (err) {
        (logger.error({ err, customerId, orderIds: createdOrders.map((o) => o.id) }),
            "Failed to schedule order expiration jobs");
    }

    try {
        await Promise.all(
            createdOrders.map((order) =>
                notifyUser({
                    userId: customerId,
                    type: "ORDER_PLACED",
                    title: "Order palced",
                    body: `Your order at ${order.shopSlug} has been placed sucessfully.`,
                    shopId:order.shopId,
                     meta: {
                        orderId: order.id,
                        shopName: order.shopSlug, 
                        totalAmount: order.totalAmount,
                        itemCount: order.itemCount,
                    },
                }),
            ),
        );
    } catch (err) {
        logger.error({ err, customerId }, "Failed to send order-placed notifications");
    }

    try {
        await clearCart(customerId);
    } catch (err) {
        logger.error({ err, customerId }, "Failed to clear cart after checkout");
    }

    //  — build response
    const grandTotal = createdOrders
        .reduce((sum, order) => sum + Number(order.totalAmount), 0)
        .toFixed(2);

    return {
        orders: createdOrders,
        totalOrders: createdOrders.length,
        grandTotal,
    };
};

export const getCustomerOrdersService = async (customerId: string, query: GetOrdersQuery) => {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, query.limit ?? 10);
    const skip = (page - 1) * limit;

    const { orders, total } = await getCustomerOrdersRepository({
        customerId,
        status: query.status,
        skip,
        take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    const shaped = orders.map((order) => ({
        id: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        shop: {
            slug: order.shop.slug,
            name: order.shop.profile?.name ?? null,
            logo: order.shop.profile?.logo ?? null,
        },
        itemCount: order.items.length,
        payment: order.payment ?? null,
    }));

    return {
        orders: shaped,
        pagination: {
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        },
    };
};

export const getCustomerrderByIdService = async (orderId: string, customerId: string) => {
    const order = await getCustomerOrderByIdRepository(orderId, customerId);

    if (!order) {
        throw new AppError("Order not found.", 404);
    }

    return order;
};

export const cancelOrderService = async (orderId: string, customerId: string) => {
    const order = await findOrderForCancelRepository(orderId, customerId);

    if (!order) {
        throw new AppError("Order not found.", 404);
    }

    if (!["PENDING", "CONFIRMED"].includes(order.status)) {
        throw new AppError(`Order cannot be cancelled - current status is ${order.status}`, 400);
    }
    return cancelOrderRepository(orderId, order.items);
};

export const getShopOrdersService = async (shopId: string, query: GetOrdersQuery) => {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, query.limit ?? 20);
    const skip = (page - 1) * limit;

    const { orders, total } = await getShopOrdersRepository({
        shopId,
        status: query.status,
        skip,
        take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    const shaped = orders.map((order) => ({
        id: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        itemCount: order.items.length,
        shipTo: {
            fullName: order.shippingAddress?.fullName ?? null,
            city: order.shippingAddress?.city ?? null,
            country: order.shippingAddress?.country ?? null,
        },
        paymentStatus: order.payment?.status ?? null,
    }));

    return {
        orders: shaped,
        pagination: {
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        },
    };
};

export const getShopOrderByIdService = async (orderId: string, shopId: string) => {
    const order = await getShopOrderByIdRepository(orderId, shopId);

    if (!order) {
        throw new AppError("Order not found.", 404);
    }

    return order;
};

const SHOP_ALLOWED_TRANSITIONS: Record<string, string[]> = {
    PENDING: ["CONFIRMED"],
    CONFIRMED: ["PROCESSING"],
    PROCESSING: ["SHIPPED"],
    SHIPPED: ["DELIVERED"],
    DELIVERED: [],
    CANCELLED: [],
    REFUNDED: [],
};

export const updateOrderStatusService = async (
    orderId: string,
    shopId: string,
    newStatus: OrderStatus,
) => {
    const order = await getShopOrderByIdRepository(orderId, shopId);

    if (!order) {
        throw new AppError("Order not found.", 404);
    }

    const allowedNext = SHOP_ALLOWED_TRANSITIONS[order.status] ?? [];

    if (!allowedNext.includes(newStatus)) {
        throw new AppError(`Cannot transition order from ${order.status} to ${newStatus}.`, 400);
    }

    if (newStatus === "SHIPPED" || newStatus === "DELIVERED") {
        try {
            await notifyUser({
                userId: order.customerId,
                type: newStatus === "SHIPPED" ? "ORDER_SHIPPED" : "ORDER_DELIVERED",
                title: newStatus === "SHIPPED" ? "Order shipped" : "Order delivered",
                body: `Your order #${orderId} has been ${newStatus === "SHIPPED" ? "shipped" : "delivered"}.`,
                shopId,
            });
        } catch (err) {
            logger.error({ err, orderId, newStatus }, "Failed to send order status notification");
        }
    }

    return updateOrderStatusRepository(orderId, shopId, order.status, newStatus);
};
