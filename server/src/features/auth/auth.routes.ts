import  express  from "express";

const router = express.Router()
import { registerController } from "./auth.controller.js";




router.post('/register',registerController
  //  plan

  // validator
  // controller
  // middleware
  // rateLimiter
)
// router.post('/login')
// router.post('/rotation-token')


export default router