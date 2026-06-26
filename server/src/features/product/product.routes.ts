import express from "express"
import { authenticate } from "../../middleware/auth.middleware.js"
import { validate } from "../../middleware/validate.middleware.js"
import { createProductSchema,
         getShopProductsSchema,
          updateProductSchema,
          updateProductStatusSchema,
          deleteProductSchema,
          addProductImageSchema,
          createVariantSchema,
          updateVariantSchema,
        } from "./product.schema.js"
import { createProductController
        ,getShopProductsController, 
        updateProductController,
        updateProductStatusController,
        deleteProductController,
        addProductImageController,
        createVariantController,
        updateVariantController,
    } from "./product.controller.js"

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

router.put(
    "/:productId",
    authenticate,
    validate(updateProductSchema),
    updateProductController
)

router.patch(
    "/:productId/status",
    authenticate,
    validate(updateProductStatusSchema),
    updateProductStatusController
)
router.delete(
    "/:productId",
    authenticate,
    validate(deleteProductSchema),
    deleteProductController
)
router.post(
    "/:productId/images",
    authenticate,
    validate(addProductImageSchema),
    addProductImageController
)

router.post(
    "/:productId/variants",
    authenticate,
    validate(createVariantSchema),
    createVariantController
)

router.put(
    "/:productId/variants/:variantId",
    authenticate,
    validate(updateVariantSchema),
    updateVariantController
)

export default router