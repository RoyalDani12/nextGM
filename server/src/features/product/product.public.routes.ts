// src/features/product/product.public.routes.ts
import express from "express"
import { getPublicProductController } from "./product.controller.js"

const router = express.Router()

router.get(
    "/:productId",
    getPublicProductController
    
)

export default router