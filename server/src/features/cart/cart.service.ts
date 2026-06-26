import { AppError } from "../../middleware/appError.js"
import { findPublicProductById } from "../product/product.repository.js"
import {
    findVariantById,
    getOrCreateCart,
    upsertCartItem,
} from "./cart.repository.js"

interface AddToCartInput {
    productId:  string
    variantId?: string
    quantity:   number
}

export const addToCartService = async (
    userId: string,
    body:   AddToCartInput
) => {
    const { productId, variantId, quantity } = body

    const product = await findPublicProductById(productId)

    if (!product) {
        throw new AppError("Product not found.", 404)
    }

    if (variantId) {
        const variant = await findVariantById(variantId, productId)

        if (!variant) {
            throw new AppError("Variant not found.", 404)
        }

        if (variant.stock < quantity) {
            throw new AppError(
                `Insufficient stock. Only ${variant.stock} available.`,
                400
            )
        }
    } else {
        if (product.stock < quantity) {
            throw new AppError(
                `Insufficient stock. Only ${product.stock} available.`,
                400
            )
        }
    }

    const cart = await getOrCreateCart(userId)

    const cartItem = await upsertCartItem(
        cart.id,
        productId,
        quantity,
        variantId
    )

    return cartItem
}