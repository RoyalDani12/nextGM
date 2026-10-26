import { Job,Worker } from "bullmq"
import { redis } from "../../cache/redis.client.js"
import { createNotificationRecored } from "../../../features/notification/notification.repository.js"
import { emailQueue } from "../queue.client.js"
import { renderOrderPlacedEmail, renderGenericNotificationEmail } from "../../../services/email.templates.js";
import { findUserById } from "../../../features/auth/auth.repository.js"; 

export const notificationWorker = new Worker(
    "notifications",
    async (job: Job) => {
        const { userId, type, title, body, shopId, sendEmail, meta } = job.data;

        await createNotificationRecored({ userId, type, title, body, shopId });

        if (!sendEmail) return;
              
        const user = await findUserById(userId);

        if (!user?.email) {
            console.error(`Cannot send notification email — no email found for user ${userId}`);
            return;
        } 
        let html: string;

        if (type === "ORDER_PLACED" && meta?.orderId && meta?.shopName) {
            html = renderOrderPlacedEmail({
                customerName: user.name || "Customer",
                orderId: meta.orderId,
                shopName: meta.shopName,
                totalAmount: String(meta.totalAmount || "0.00"),
                itemCount: meta.itemCount || 1,
            });
        } else {
            html = renderGenericNotificationEmail({
                userName: user.name || "Customer",
                title,
                body,
            });
        }
            await emailQueue.add("notification-email", {
                to: user.email,
                subject: title,
                html,
            });
        },
    {
        connection: redis,
        concurrency: 5,
    },
);

notificationWorker.on("completed", (job) => console.log(`Notification ${job.id} done.`));
notificationWorker.on("failed", (job, err) =>
    console.error(`Notification ${job?.id} failed`, err.message),
);