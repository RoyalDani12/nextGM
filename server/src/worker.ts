import { emailWorker } from "./infrastructure/queue/workers/email.worker.js";

console.log("Worker started",emailWorker.isRunning())