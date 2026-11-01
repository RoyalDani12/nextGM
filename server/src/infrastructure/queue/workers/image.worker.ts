import { Job, Worker } from "bullmq";
import { queueRedis } from "../../cache/redis.client.js";
import { deleteImageFromCloudinary } from "../../storage/cloudinary.client.js";

export const imageWorker = new Worker(
    "image-cleanup",
    async (job: Job) => {
        const { publicId } = job.data;

        if (!publicId) {
            return;
        }
        console.log(`[Queue] Deleting old avatar: ${publicId}`);

        await deleteImageFromCloudinary(publicId);
    },
    {
        connection:queueRedis,
        concurrency: 3,
    },
);

imageWorker.on("completed", (job) => console.log(`Image cleanup ${job.id} done.`));


imageWorker.on("failed", (job, err) =>
    console.error(`Image cleanup ${job?.id} failed`, err.message),
);
