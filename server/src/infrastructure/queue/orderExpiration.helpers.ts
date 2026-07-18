import { orderExpirationQueue } from "./queue.client.js";
import { env } from "../../config/env.js";

const RESERVATION_TTL_MS = Number (env.ORDER_RESERVATION_TTL_MINUTES ?? 15) * 60_000

export const scheduleOrderExpiration = async (orderId :string )=>{
  await orderExpirationQueue.add(
    "expire-order",
    { orderId },
    {
      jobId:orderId,
      delay:RESERVATION_TTL_MS,
    }
  )
}

export const cancelOrderExpiration = async ( orderId:string )=>{
  const job = await orderExpirationQueue.getJob(orderId)
  if(job){
    await job.remove()
  }
}

export const getReservationExpiryTimestamp =()=> new Date(Date.now() + RESERVATION_TTL_MS )