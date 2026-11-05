import { env } from "./config/env.js";
import app from "./app.js";
import { logger } from "./config/logger.js";
import { ensureSuperAdmin } from "./bootstrap/admin.bootstrap.js";


let PORT: number = Number(env.PORT) || 3000

if (!env.PORT) {
  throw new Error("PORT is not defined");
}
app.listen(PORT, async () => {
  logger.info(`server running on port ${PORT}`);
  await ensureSuperAdmin();
});
