import dotenv from "dotenv";
import { string, z } from "zod";
dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.string().default("5000").transform(Number),
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(8),
    JWT_REFRESH_SECRET: z.string().trim(),

    // Redis
    REDIS_URL: z.string().url(),

    // SMTP
    SMTP_HOST: z.string(),
    SMTP_PORT: z.string().transform(Number), // Automatically turns string "587" into number 587

    SMTP_USER: z.string(),
    SMTP_PASS: z.string(),
    CLIENT_URL: z.string().url(),
    DEVICE_LIMIT: z.string().transform(Number),

    CLOUDINARY_CLOUD_NAME: z.string().trim().min(1, "Cloudinary Cloud Name is Required."),
    CLOUDINARY_API_KEY: z.string().min(1, "Cloudinary API Key is required"),
    CLOUDINARY_API_SECRET: z.string().min(1, "Cloudinary API Secret is required"),
    ORDER_RESERVATION_TTL_MINUTES: z.string().transform(Number),
    STRIPE_SECRET_KEY:z.string().min(1,"Stripe API key us required"),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
    console.error("Invalid environmental variable", _env.error.format());
    process.exit(1);
}

export const env = _env.data;
