import dotenv from "dotenv"
dotenv.config()
import express from "express"
const app = express()
import helmet from "helmet"
import { corsConfig } from "./config/cors.js"
import morgan from "morgan"
import { errHandler } from "./middleware/errorHandler.middleware.js"
import { notFound } from "./middleware/notFound.js"



// security first
app.use(helmet())
app.use(corsConfig)

// http request  logger
app.use(morgan("dev"))

//parse JSON bodies
app.use(express.json())

app.get('/',(req ,res)=>{
  res.json({message:"server running successfully"})
})

app.use(notFound)
app.use(errHandler)



export default app