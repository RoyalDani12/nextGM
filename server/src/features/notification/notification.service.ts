import { NotificationType } from "@prisma/client";
import { logger } from "../../config/logger.js"
import { findNotificationPreference } from "./notification.repository.js";
import { notificationQueue } from "../../infrastructure/queue/queue.client.js";

const CATEGORY_MAP: Record<NotificationType, "orderUpdates" | "promotions" | "reviews"> = {
    ORDER_PLACED: "orderUpdates",
    ORDER_SHIPPED: "orderUpdates",
    ORDER_DELIVERED: "orderUpdates",
    PAYMENT_SUCCESS: "orderUpdates",
    PAYMENT_REFUNDED: "orderUpdates",
    PAYMENT_FAILED: "orderUpdates",
    COUPON_EXPIRING: "promotions",
    MEMBERSHIP_EXPIRING: "promotions",
    REVIEW_RECEIVED: "reviews",
};

export const notifyUser = async (params :{
  userId:string;
  type:NotificationType;
  title:string;
  body:string;
  shopId?:string;
   meta?: Record<string, any>;
})=>{
  const { userId,type , title,body,shopId,meta }  = params
  const pref = await findNotificationPreference(userId)

  const category = CATEGORY_MAP[type]
  // missing preference row = fully opted-in,
  const categoryEnabled = pref ? pref[category] :true

  if(!categoryEnabled){
    logger.info({ userId,type },"Notification skipped - category disabled by user.")
  }

  const emailEnabled = pref ? pref.emailEnabled : true

  try {
     await notificationQueue.add("send-notification",{
      userId,
      type,
      title,
      body,
      shopId,
      sendEmail:emailEnabled,
      meta,
     })
  } catch (err) {
    // a failed notification should not break the calling flow checkout ,payment...
    logger.error({ err,userId,type },"Failed to enqueue notification")
  }
}