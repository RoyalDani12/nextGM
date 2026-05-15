
import { emailWorker } from "./infrastructure/queue/workers/email.worker.js";
import { imageWorker } from "./infrastructure/queue/workers/image.worker.js";


console.log("Email Worker started",emailWorker.isRunning())
console.log("Image Worker started",imageWorker.isRunning())