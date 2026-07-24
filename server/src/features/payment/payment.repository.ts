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