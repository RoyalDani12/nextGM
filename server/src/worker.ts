
import { emailWorker } from "./infrastructure/queue/workers/email.worker.js";
import { imageWorker } from "./infrastructure/queue/workers/image.worker.js";
import { accountPurgeWorker } from "./infrastructure/queue/workers/accountPurge.work.js";
import { orderExpirationWorker } from "./infrastructure/queue/workers/orderExpiration.worker.js";
import { orderExpirationQueue } from "./infrastructure/queue/queue.client.js";


console.log("Email Worker started",emailWorker.isRunning())
console.log("Image Worker started",imageWorker.isRunning())
console.log("Account Purge Worker started",accountPurgeWorker.isRunning())
console.log("Order Expiration Worker started", orderExpirationWorker.isRunning());

(
  async () =>{
    await orderExpirationQueue.add(
      "sweep-expired-orders",
      {},
      { repeat : { every : 5 * 60 * 1000 }, jobId:"sweep-repeatable"},
    )
     console.log("Order expiration sweep scheduled (every 5 min)");
  }
)()