
import express from "express";
const router = express.Router();
import {
  registerController,
  verifyEmailController,
  loginController,
  refreshTokenController,
  logoutController,
  resendVerificationController,
  forgotPasswordController,
  resetPasswordController,
  googleAuthController,
  googleCallbackController,
  exchangeTicketController,
  reactivateAccountController,
} from "./auth.controller.js";

import { 
  registerSchema,
  verifyEmailSchema,
  loginSchema,
  resendVerificationSchema, 
  forgotPasswordSchema, 
  resetPasswordSchema,
  reactivateSchema}
  from "./auth.schema.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
  authLimiter,
  loginLimiter,
  emailVerificationLimiter,
  passwordResetLimiter,
} from "../../middleware/rateLimiter.middleware.js";
import { authenticate } from "../../middleware/auth.middleware.js";



router.post(
  "/register",
   authLimiter,
   validate(registerSchema),
   registerController,
);

router.get(
  "/verify-email",
  emailVerificationLimiter,
  validate(verifyEmailSchema),
  verifyEmailController,
);

router.post('/login',
  loginLimiter,
  validate(loginSchema),
  loginController
)

router.get("/google", googleAuthController);
router.get("/google/callback", googleCallbackController);
router.post("/exchange-ticket", authLimiter, exchangeTicketController);


router.post('/refresh-token',
  //  authLimiter,
  //  authenticate,
   refreshTokenController
  )

router.post('/logout',
   logoutController
)


router.post('/resend-verification',
  emailVerificationLimiter,
  validate(resendVerificationSchema),
  resendVerificationController
)

router.post('/forgot-password',
  passwordResetLimiter,
  validate(forgotPasswordSchema),
  forgotPasswordController
)

router.post('/reset-password',
  passwordResetLimiter,
  validate(resetPasswordSchema),
  resetPasswordController
)

router.post('/reactivate',
  authLimiter,
  validate(reactivateSchema),
  reactivateAccountController
)

export default router;
