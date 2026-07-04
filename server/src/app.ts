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
import cartRoute from "./features/cart/cart.routes.js"
import orderRoute from "./features/orders/order.route.js"
import { httpLogger } from "./middleware/httpLogger.middleware.js"
import shopRoute from "./features/shop/shop.routes.js"


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


app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }));
setupSwagger(app);

app.use(generalLimiter)  

app.use('/api/auth',authRoute)
app.use('/api/users',userRoute)
app.use('/api/shops',shopRoute)
app.use('/api/uploads',uploadRoute)
app.use('/api/shops/:shopId/products',productRoute)
app.use('/api/products', productPublicRoute)
app.use('/api/cart', cartRoute)
app.use('/api/orders', orderRoute)

app.get('/',(req ,res)=>{
  res.json({message:"server running successfully"})
})

app.use(notFound)
app.use(errHandler)



export default app