import express from "express"
import { authenticate } from "../../middleware/auth.middleware.js"
import { validate } from "../../middleware/validate.middleware.js"
import { createProductSchema,getShopProductsSchema } from "./product.schema.js"
import { createProductController,getShopProductsController } from "./product.controller.js"

// mergeParams: true → gives access to :shopId from the parent mount path
const router = express.Router({ mergeParams: true })

router.post(
    "/",
    authenticate,
    validate(createProductSchema),
    createProductController
)

router.get(
    "/",
    authenticate,
    validate(getShopProductsSchema),
    getShopProductsController
)

export default router