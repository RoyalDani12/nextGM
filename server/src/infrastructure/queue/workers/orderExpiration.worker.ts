import { Job,Worker } from "bullmq"
import { redis } from "../../cache/redis.client.js"
import { prisma } from "../../../config/db.js"
import { OrderStatus } from "@prisma/client"
import { logger } from "../../../config/logger.js"

export const orderExpirationWorker = new Worker(
   "order-expiration",
   async (job:Job)=>{
    const { orderId } = job.data

    if(!orderId){
      return
    }

    await prisma.$transaction( async(tx)=>{
            // atomic guard — only fires if order is STILL PENDING.
            // If payment confirmed it, or it was cancelled, or an
            // earlier sweep already caught it, count is 0 and we no-op.
        const guard = await tx.order.updateMany({
          where:{ id:orderId, status : "PENDING" as OrderStatus} ,
          data: { status: "EXPIRED" as OrderStatus},
        })

        if(guard.count === 0){
          return 
        }

        const order = await tx.order.findUnique({
          where:{ id: orderId },
          select :{
            couponId:true,
            customerId:true,
            items :{
              select :{ productId:true,variantId:true ,quantity:true}
            }
          }
        })

        if(!order){
          return
        }

        if (order.couponId) {
          const released = await tx.couponUsage.deleteMany({ where: { couponId: order.couponId, userId: order.customerId } })
          if (released.count) await tx.coupon.update({ where: { id: order.couponId }, data: { usedCount: { decrement: 1 } } })
        }

        await Promise.all(
          order.items.map((item)=>
          item.variantId
             ? tx.productVariant.update ({
              where: { id: item.variantId },
              data:{ stock: { increment :item.quantity}}
             })
             : tx.product.update({
              where: { id: item.productId },
              data: { stock :{ increment: item.quantity }}
             })
            )
        )

        await tx.orderStatusHistory.create({
          data:{
            orderId,
            status:"EXPIRED" as OrderStatus,
            note:"Reservation expired - pyment not completed within TTL window"
          }
        })
    })
     console.log(`[Queue] Order ${orderId} reservation expired, stock restored.`);
   },{
    connection:redis,
    concurrency:5,
   }

)

orderExpirationWorker.on("completed",(job)=> console.log(`Order expiration ${job.id} done.`))

orderExpirationWorker.on("failed",(job,err)=> logger.error(`Order Expiration ${job?.id} failed`))
