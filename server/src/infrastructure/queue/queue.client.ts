import { Queue } from "bullmq";
import { redis } from "../cache/redis.client.js";

export const emailQueue = new Queue("emails", {
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
emailQueue.on("error", () => {});

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
imageCleanupQueue.on("error", () => {});

export const accountPurgeQueue = new Queue("accountPurgeQueue", {
    connection: redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 500,
        },
        removeOnComplete: true,
        removeOnFail: false,
    },
});
accountPurgeQueue.on("error", () => {});

export const orderExpirationQueue = new Queue("order-expiration", {
    connection: redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 500,
        },
        removeOnComplete: true,
        removeOnFail: {
            age: 24 * 60 * 60 * 1000,
        },
    },
});
orderExpirationQueue.on("error", () => {});

export const notificationQueue = new Queue("notifications", {
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
notificationQueue.on("error", () => {});
