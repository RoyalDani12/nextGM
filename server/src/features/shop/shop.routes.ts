import express from "express"
import { authenticate } from "../../middleware/auth.middleware.js"
import { validate } from "../../middleware/validate.middleware.js"
import { createShopController,
         getMyShopController,
         updateShopProfileController,
         getShopBySlugController
     } from "./shop.controller.js"
import { createShopSchema,updateShopProfileSchema } from "./shop.schema.js"
// import { create } from "domain"

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

