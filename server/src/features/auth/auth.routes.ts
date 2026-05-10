
import express from "express";
const router = express.Router();
import {
  registerController,
  verifyEmailController,
  loginController,
  refreshTokenController,
} from "./auth.controller.js";

import { registerSchema,verifyEmailSchema,loginSchema } from "./auth.schema.js";
import { validate } from "../../middleware/validate.middleware.js";
import { authLimiter } from "../../middleware/rateLimiter.middleware.js";



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
   refreshTokenController
  )

export default router;
