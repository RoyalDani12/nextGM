import { AppError } from "../../middleware/appError.js";
import { getCartWithItems, clearCart } from "../cart/cart.repository.js";
import { createOrdersFromCart } from "./order.repository.js";
import { shipAddressInput } from "./order.types.js";

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
        await clearCart(customerId);
    } catch (err) {
        // log but don't fail the whole checkout over this
        console.error("Failed to clear cart after checkout:", err);
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
