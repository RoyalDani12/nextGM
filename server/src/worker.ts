
import { emailWorker } from "./infrastructure/queue/workers/email.worker.js";
import { imageWorker } from "./infrastructure/queue/workers/image.worker.js";
import { accountPurgeWorker } from "./infrastructure/queue/workers/accountPurge.work.js";


console.log("Email Worker started",emailWorker.isRunning())
console.log("Image Worker started",imageWorker.isRunning())
console.log("Account Purge Worker started",accountPurgeWorker.isRunning())