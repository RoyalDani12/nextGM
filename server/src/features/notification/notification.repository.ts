import { NotificationType } from "@prisma/client";
import { prisma } from "../../config/db.js";

export const findNotificationPreference = async ( userId:string,)=>{
  return prisma.notificationPreference.findUnique({
    where: { userId }
  })
}


export const createNotificationRecored = async ( data: {
  userId:string;
  type:NotificationType;
  title:string;
  body:string;
  shopId?:string;
})=>{
  return prisma.notification.create({
    data
  })
}