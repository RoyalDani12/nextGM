import express from "express"
import { authenticate } from "../../middleware/auth.middleware.js"
import { validate } from "../../middleware/validate.middleware.js"
import { createShopController,
         getMyShopController,
         updateShopProfileController,
         getShopBySlugController,
         updateShopStatusController
     } from "./shop.controller.js"
import { createShopSchema,updateShopProfileSchema,updateShopStatusSchema } from "./shop.schema.js"

const router = express.Router()

router.post(
  "/",
  authenticate,
  validate(createShopSchema),
  createShopController
)
router.get(
    "/me",
    authenticate,
    getMyShopController
)
router.patch(
    "/status/:id",
    authenticate,
    validate(updateShopStatusSchema),
    updateShopStatusController
)
router.put(
    "/:id/profile",
    authenticate,
    validate(updateShopProfileSchema),
    updateShopProfileController
)

router.get(
    "/:slug",
    getShopBySlugController
    
)
export default router

