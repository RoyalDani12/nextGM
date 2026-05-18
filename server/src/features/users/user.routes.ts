import express from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import {
    changePasswordController,
    deactivateAccountController,
    getMeController,
    getUploadSignatureController,
    updateUserProfileController,
} from "./user.controller.js";
import { validate } from "../../middleware/validate.middleware.js";
import { changePasswordSchema, deactivateSchema, updateProfileSchema } from "./user.schema.js";
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

export default router;
