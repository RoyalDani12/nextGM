import cors from "cors";
import { env } from "./env.js";

export const corsConfig = cors({
  origin: env.ALLOWED_ORIGINS,
  credentials: true,
  methods: ["GET", "POST", "DELETE", "PATCH", "PUT"],
});
