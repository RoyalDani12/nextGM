import express from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import {
    changePasswordController,
    deactivateAccountController,
    deleteAccountController,
    getMeController,
    getUploadSignatureController,
    reactivateAccountController,
    updateUserProfileController,
    getSessionsController,
    revokeSessionController,
} from "./user.controller.js";
import { validate } from "../../middleware/validate.middleware.js";
import { changePasswordSchema, deactivateSchema, deleteAccountSchema, reactivationSchema, updateProfileSchema } from "./user.schema.js";
import { authLimiter } from "../../middleware/rateLimiter.middleware.js";
const router = express.Router();

router.get(
    "/me", 
     authenticate,
     getMeController
    );


router.get(
    "/me/upload-signature",
     authenticate, 
     getUploadSignatureController
    );

router.put(
    "/me", 
    authenticate,
    validate(updateProfileSchema), 
    updateUserProfileController
);

router.patch(
    "/me/change-password",
    authenticate,
    validate(changePasswordSchema),
    changePasswordController,
);
router.post('/me/deactivate',
    authenticate,
    validate(deactivateSchema),
    deactivateAccountController
)

router.post(
    '/me/reactivate',
    authLimiter,
    validate(reactivationSchema),
    reactivateAccountController
)
router.delete(
    '/me',
     authLimiter,
     authenticate,
     validate(deleteAccountSchema),
     deleteAccountController
)

router.get(
    "/me/sessions",
    authenticate,
    getSessionsController
)

router.delete(
    "/me/sessions/:id",
    authenticate,
    revokeSessionController
);
export default router;
