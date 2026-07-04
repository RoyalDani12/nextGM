import { prisma } from "../../config/db.js";
import { GetCustomerOrdersOptions, shipAddressInput, shopGroup } from "./order.types.js";
import crypto from "crypto";

export const createOrdersFromCart = async (
    customerId: string,
    shopGroups: shopGroup[],
    shippingAddress: shipAddressInput,
) => {
    return prisma.$transaction(async (tx) => {
        const createdOrders = [];

        for (const group of shopGroups) {
            // Calculate order total
            let totalAmount = 0;

            for (const item of group.items) {
                const unitPrice = item.variant
                    ? Number(item.variant.price)
                    : Number(item.product.basePrice);

                totalAmount += unitPrice * Number(item.quantity);
            }

            // create order row
            const order = await tx.order.create({
                data: {
                    shopId: group.shopId,
                    customerId,
                    totalAmount: totalAmount.toFixed(2),
                    status: "PENDING",
                    idempotencyKey: crypto.randomUUID(),
                },
            });

            // create orderItems - sanpshot price at purchase time
            for (const item of group.items) {
                const unitPrice = item.variant
                    ? Number(item.variant.price)
                    : Number(item.product.basePrice);

                await tx.orderItem.create({
                    data: {
                        orderId: order.id,
                        productId: item.productId,
                        variantId: item.variantId ?? null,
                        quantity: Number(item.quantity),
                        unitPrice: unitPrice.toFixed(2),
                    },
                });
            }
            // create Shipping  address
            await tx.shippingAddress.create({
                data: {
                    orderId: order.id,
                    fullName: shippingAddress.fullName,
                    phone: shippingAddress.phone,
                    address: shippingAddress.address,
                    city: shippingAddress.city,
                    country: shippingAddress.country,
                    postalCode: shippingAddress.postalCode,
                },
            });
            // create initial order status history
            await tx.orderStatusHistory.create({
                data: {
                    orderId: order.id,
                    status: "PENDING",
                    note: "Order placed by customer.",
                },
            });

            // decrement stock atomically
            for (const item of group.items) {
                if (item.variantId) {
                    await tx.productVariant.update({
                        where: { id: item.variantId },
                        data: {
                            stock: { decrement: Number(item.quantity) },
                        },
                    });
                } else {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: {
                            stock: { decrement: Number(item.quantity) },
                        },
                    });
                }
            }
            createdOrders.push({
                id: order.id,
                shopId: group.shopId,
                shopSlug: group.shopSlug,
                totalAmount: totalAmount.toFixed(2),
                status: "PENDING",
                itemCount: group.items.length,
            });
        }
        return createdOrders;
    });
};


export const getCustomerOrdersRepository = async (
     options:GetCustomerOrdersOptions
)=>{
      const { customerId,status,skip,take } = options

      const where ={
        customerId,
        deletedAt:null,
        ...(status &&{ status })
      }
      const [orders,total ] = await Promise.all([
        prisma.order.findMany({
            where,
            select: {
                id:true,
                status:true,
                totalAmount:true,
                createdAt:true,
                shop:{
                    select:{
                        slug:true,
                        profile :{
                            select :{
                                name:true,
                                logo:true,
                            }
                        }
                    }
                },
                items:{
                    select: { id: true }
                },
                payment:{
                    select:{ status:true }
                }
            },
            orderBy:{ createdAt: "desc" },
            skip,
            take,
        }),
        prisma.order.count({ where })
      ])
      return { orders,total }
}