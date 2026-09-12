import express from "express"
import { authenticate } from "../../middleware/auth.middleware.js"
import { validate } from "../../middleware/validate.middleware.js"
import { createShopController,
         getMyShopsController,
         updateShopProfileController,
         getShopBySlugController,
         updateShopStatusController,
         closeShopController,
         updateShopLegalInfoController,
         publishShopController,
         getPublishReadinessController,
         getShopWalletController,
         createConnectOnboardingLinkController,
         initiatePayoutController
     } from "./shop.controller.js"
import { createShopSchema,updateShopProfileSchema,updateShopStatusSchema,closeShopSchema,updateShopLegalInfoSchema } from "./shop.schema.js"
import { authorizeShopAccess } from "../../middleware/authorizeShopAccess.middleware.js"

const router = express.Router()

router.post(
  "/",
  authenticate,
  validate(createShopSchema),
  createShopController
)
router.get(
    "/mine",
    authenticate,
    getMyShopsController,
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
router.delete(
    "/:id",
    authenticate,
    validate(closeShopSchema),
    closeShopController
)

//  thisone is for public user  store front
router.get(
    "/:slug",
    getShopBySlugController
    
)

 router.put(
    "/:shopId/legal-info",
    authenticate,
    authorizeShopAccess,
    validate(updateShopLegalInfoSchema),
    updateShopLegalInfoController,
)
router.get(
    "/:shopId/publish-readiness",
    authenticate,
    authorizeShopAccess,
    getPublishReadinessController,
)
router.patch(
    "/:shopId/publish",
    authenticate,
    authorizeShopAccess,
    publishShopController,
)
router.get(
    "/:shopId/wallet",
    authenticate,
    authorizeShopAccess,
    getShopWalletController,
)

router.post(
    "/:shopId/connect/onboard",
     authenticate,
     authorizeShopAccess, 
     createConnectOnboardingLinkController
    )

    router.post(
    "/:shopId/payout",
    authenticate,
    authorizeShopAccess,
    initiatePayoutController,
);
export default router

