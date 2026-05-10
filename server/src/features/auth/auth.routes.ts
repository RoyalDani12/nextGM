
import express from "express";
const router = express.Router();
import {
  registerController,
  verifyEmailController,
  loginController,
  refreshTokenController,
  logoutController,
  resendVerificationController,
} from "./auth.controller.js";

import { registerSchema,verifyEmailSchema,loginSchema, resendVerificationSchema } from "./auth.schema.js";
import { validate } from "../../middleware/validate.middleware.js";
import { authLimiter } from "../../middleware/rateLimiter.middleware.js";
import { authenticate } from "../../middleware/auth.middleware.js";



router.post(
  "/register",
   authLimiter,
   validate(registerSchema),
   registerController,
);

router.get(
  "/verify-email",
  authLimiter,
  validate(verifyEmailSchema),
  verifyEmailController,
);

router.post('/login',
  authLimiter,
  validate(loginSchema),
  loginController
)


router.post('/refresh-token',
   authLimiter,
   authenticate,
   refreshTokenController
  )

router.post('/logout',
   authLimiter,
   authenticate,
   logoutController
)


router.post('/resend-verification',
  authLimiter,
  validate(resendVerificationSchema),
  resendVerificationController
)

export default router;
