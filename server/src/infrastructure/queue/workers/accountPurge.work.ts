import { Worker, Job } from "bullmq";

import { PurgeJobData } from "../../../features/users/user.types.js";
import { prisma } from "../../../config/db.js";
import { anonymizeUserRecord } from "../../../features/users/user.repository.js";
import { redis } from "../../cache/redis.client.js";

export const accountPurgeWorker = new Worker<PurgeJobData>(
    "accountPurgeQueue",
    async (job: Job<PurgeJobData>) => {
        const { userId } = job.data;

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || user.status !== "DELETED") {
            return;
        }

        await anonymizeUserRecord(userId);
    },
    {
        connection: redis,
    },
);
