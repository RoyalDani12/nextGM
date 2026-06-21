import express from "express"
import { authenticate } from "../../middleware/auth.middleware.js"
import { validate } from "../../middleware/validate.middleware.js"
import { createProductSchema,
         getShopProductsSchema,
          updateProductSchema,
          updateProductStatusSchema,
          deleteProductSchema,
          addProductImageSchema,
        } from "./product.schema.js"
import { createProductController
        ,getShopProductsController, 
        updateProductController,
        updateProductStatusController,
        deleteProductController,
        addProductImageController,
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
export default router