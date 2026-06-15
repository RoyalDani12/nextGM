import express from "express"
import { authenticate } from "../../middleware/auth.middleware.js"
import { validate } from "../../middleware/validate.middleware.js"
import { getUploadSignatureSchema } from "./upload.schema.js"
import { getUploadSignatureController } from "./upload.controller.js"

const router = express.Router()

router.get(
    "/signature",
    authenticate,
    validate(getUploadSignatureSchema),
    getUploadSignatureController
)

export default router