import { prisma } from "../../config/db.js";
import { orderExpirationQueue } from "./queue.client.js";

export const sweepExpiredOrdersJob = async ()=>{
  const orphaned = await prisma.order.findMany({
    where: {
      status:"PENDING",
      reservationExpiresAt:{ lt: new Date() }
    },
    select :{ id: true }
  })

  for( const order of orphaned ){
    await orderExpirationQueue.add(
      "expire-order",
      { orderId:order.id },
      { jobId:`sweep- ${order.id } - ${Date.now()}`}
    )
  }
  if ( orphaned.length > 0){
     console.log(`[Sweep] Re-queued ${orphaned.length} orphaned pending orders.`)
  }
}