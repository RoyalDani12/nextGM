import express from "express"
import { authenticate } from "../../middleware/auth.middleware.js"
import { getMeController } from "./user.controller.js"
const router  = express.Router()




router.get('/me',
  authenticate,
  getMeController
)


export default router