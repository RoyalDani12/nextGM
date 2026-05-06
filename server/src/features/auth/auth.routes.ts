import express from "express";

const router = express.Router();
import {
  registerController,
  verifyEmailController,
} from "./auth.controller.js";
import { registerSchema,verifyEmailSchema } from "./auth.schema.js";
import { validate } from "../../middleware/validate.middleware.js";
import { authLimiter } from "../../middleware/rateLimiter.middleware.js";

router.post(
  "/register",
   authLimiter,
  validate(registerSchema),
 
  registerController,

  //  plan

  // validator
  // controller
  // middleware
  // rateLimiter
);
router.get(
  "/verify-email",
  authLimiter,
  validate(verifyEmailSchema),
  verifyEmailController,
);

// router.post('/login')
// router.post('/rotation-token')

export default router;
