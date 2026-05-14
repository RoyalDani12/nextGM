import express from "express"
import { authenticate } from "../../middleware/auth.middleware.js"
import { getMeController, getUploadSignatureController, updateUserProfileController } from "./user.controller.js"
import { validate } from "../../middleware/validate.middleware.js"
import { updateProfileSchema } from "./user.schema.js"
const router  = express.Router()




router.get('/me',
  authenticate,
  getMeController
)

// the end point get permission slip for cloudinary
router.get('/me/upload-signature',
  authenticate,
  getUploadSignatureController
)

router.put('/me',
  validate(updateProfileSchema),
  authenticate,
  updateUserProfileController
)

export default router