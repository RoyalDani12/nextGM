import  express  from "express";

const router = express.Router()
import { registerController } from "./auth.controller.js";
import { registerSchema } from "./auth.schema.js";
import { validate } from "../../middleware/validate.middleware.js";





router.post('/register',
    validate(registerSchema),
  registerController,

  //  plan

  // validator
  // controller
  // middleware
  // rateLimiter
)
// router.post('/login')
// router.post('/rotation-token')


export default router