import dotenv from "dotenv";
dotenv.config();

const requiredEnvVars = ["JWT_SECRET", "DATABASE_URL", "NODE_ENV"] as const;

//  validate all env vars exist at start
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const env = {
  JWT_SECRET: process.env.JWT_SECRET as string,
  DATABASE_URL: process.env.DATABASE_URL as string,
  NODE_ENV: process.env.NODE_ENV as string,
  PORT: process.env.PORT || "5000",
} as const;
