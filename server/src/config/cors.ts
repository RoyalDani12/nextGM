import cors from "cors";

export const corsConfig = cors({
  origin: process.env.ALLOWED_ORIGINS,
  credentials: true,
  methods: ["GET", "POST", "DELETE", "PATCH", "PUT"],
});
