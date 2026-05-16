import { Queue } from "bullmq";
import { redis } from "../cache/redis.client.js";

export const emailQueue = new Queue("emails", {
    connection: redis,
    defaultJobOptions: {
        // if the job fails retry up to 3 times
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 5000,
        },

        // remove jobs after success
        removeOnComplete: true,

        // keep failed jobs for 24 hash
        removeOnFail: {
            age: 24 * 60 * 60,
        },
    },
});

console.log("email Queue initialized");

export const imageCleanupQueue = new Queue("image-cleanup", {
    connection: redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: {
            age: 24 * 60 * 60,
        },
    },
});
