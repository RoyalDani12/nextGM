import express from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
  getNotificationsController,
  getUnreadCountController,
  markAsReadController,
  markAllAsReadController,
  deleteNotificationController,
  getPreferencesController,
  updatePreferencesController,
} from "./notification.controller.js";
import {
  getNotificationsSchema,
  notificationIdParamSchema,
  markAllReadSchema,
  updatePreferencesSchema,
} from "./notification.schema.js";

const router = express.Router();

router.use(authenticate);

router.get("/", validate(getNotificationsSchema), getNotificationsController);
router.get("/unread-count", getUnreadCountController);
router.patch("/read-all", validate(markAllReadSchema), markAllAsReadController);
router.get("/preferences", getPreferencesController);
router.put("/preferences", validate(updatePreferencesSchema), updatePreferencesController);
router.patch("/:id/read", validate(notificationIdParamSchema), markAsReadController);
router.delete("/:id", validate(notificationIdParamSchema), deleteNotificationController);

export default router;
