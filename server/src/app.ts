import dotenv from "dotenv"
dotenv.config()
import express from "express"
import { setupSwagger } from "./config/swagger.config.js"
const app = express()
import helmet from "helmet"
import cookieParser from "cookie-parser"
import { corsConfig } from "./config/cors.js"
// import morgan from "morgan"
import { errHandler } from "./middleware/errorHandler.middleware.js"
import { notFound } from "./middleware/notFound.js"
import { generalLimiter } from "./middleware/rateLimiter.middleware.js"
import authRoute from "./features/auth/auth.routes.js"
import userRoute from './features/users/user.routes.js'
import uploadRoute from './features/uploads/upload.routes.js'
import productRoute from './features/product/product.routes.js'
import productPublicRoute from "./features/product/product.public.routes.js"
import paymentRoute from "./features/payment/payment.route.js"
import paymentWebhookRoute from "./features/payment/payment.webhook.route.js"
import paymentAdminRoute from "./features/payment/payment.admin.route.js"
import cartRoute from "./features/cart/cart.routes.js"
import orderRoute from "./features/orders/order.route.js"
import { httpLogger } from "./middleware/httpLogger.middleware.js"
import shopRoute from "./features/shop/shop.routes.js"
import adminRoute from "./features/admin/admin.route.js"
import categoryRoute from "./features/category/category.routes.js"
import engagementRoute from "./features/engagement/engagement.routes.js"
import couponRoute from "./features/coupon/coupon.routes.js"
import notificationRoute from "./features/notification/notification.routes.js"


// security first
app.use(httpLogger)
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
)
app.use(corsConfig)

// http request  logger
// app.use(morgan("dev"))


  /*    ── WEBHOOK ROUTE — must be mounted BEFORE express.json(), with raw body ──
    Stripe signs the exact raw request bytes. If express.json() parses this
    body first, the signature verification will fail on every delivery,
    because the re-serialized JSON won't byte-match what Stripe signed. 
  */
app.use('/api/v1/payment/webhooks/stripe',paymentWebhookRoute)

app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }));
setupSwagger(app);

app.use(generalLimiter)  

import payoutRoute from "./features/payouts/payout.route.js"

app.use('/api/v1/auth',authRoute)
app.use('/api/v1/users',userRoute)
app.use('/api/v1/shops',shopRoute)
app.use('/api/v1/uploads',uploadRoute)
app.use('/api/v1/shops/:shopId/products',productRoute)
app.use('/api/v1/shops/:shopId/coupons', couponRoute)
app.use('/api/v1/products', productPublicRoute)
app.use('/api/v1/categories', categoryRoute)
app.use('/api/v1', engagementRoute)
app.use('/api/v1/cart', cartRoute)
app.use('/api/v1/orders', orderRoute)
app.use('/api/v1/payment',paymentRoute)
app.use('/api/v1/admin/orders', paymentAdminRoute) 
app.use('/api/v1/payouts', payoutRoute)
app.use('/api/v1/admin', adminRoute)
app.use('/api/v1/notifications', notificationRoute)

app.get('/',(req ,res)=>{
  res.json({message:"server running successfully"})
})

app.use(notFound)
app.use(errHandler)



export default app
