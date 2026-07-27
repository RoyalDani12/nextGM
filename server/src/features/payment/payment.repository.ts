import { tryCatch } from "bullmq";
import { prisma } from "../../config/db.js";

export const createPaymentRecord = async ( data:{
  orderId:string,
  amount:string,
  currency:string,
  provider:"STRIPE",
  idempotencyKey:string
})=>{
  return prisma.payment.create({ data })
}

export const findPaymentByOrderId = async(orderId:string)=>{
  return prisma.payment.findUnique({
       where:{ orderId }
  })
}

export const updatePaymentProvider = async ( paymentId:string,providerPaymentId:string)=>{
  return prisma.payment.update({
    where: { id:paymentId },
    data: { providerPaymentId }
  })
}

export const insertWebhookEventOnce = async ( stripeEvent:string,type:string)=>{
   try {
     await prisma.webhookEvent.create({
      data: { stripeEventId:stripeEvent,type }
     })
     return true
   } catch (err:any) {
    if(err.code === "P2002"){
       return false 
    }
    throw err
   }
}

export const confirmPaymentAndOrder = async (orderId:string)=>{
  return prisma.$transaction( async (tx)=>{
      const paymentGuard = await tx.payment.updateMany({
        where: { orderId, status: "PENDING" },
        data: { status: "COMPLETED" }
      })

      if(paymentGuard.count === 0){
        return { alreadyProcessed:true }
      }

      const orderGuard = await tx.order.updateMany({
        where : { id : orderId ,status :"PENDING" },
        data: { status: "CONFIRMED"}
      })

      if(orderGuard.count > 0){
        await tx.orderStatusHistory.create({
          data: {
            orderId,
            status:"CONFIRMED",
            note:"Payment Confirmed Via Stripe."
          }
        })
      }
      return { alreadyProcessed :false }
  })
}

export const markPaymentFaild = async ( orderId:string)=>{
  return prisma.payment.updateMany({
    where: { orderId, status: "PENDING" },
    data: { status:"FAILED" }
  })
}