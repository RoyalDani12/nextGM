import express  from  "express"
import { stripeWebhookController

 } from "./payment.controller.js"
 const router = express.Router()

 router.post(
  "/",
  express.raw({ type : "application/json"}),
  stripeWebhookController
 )

 export default router