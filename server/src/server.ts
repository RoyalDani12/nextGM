import { env } from "./config/env.js";
import app from "./app.js";
import { logger } from "./config/logger.js";


let PORT: number = Number(env.PORT) || 3000

if (!env.PORT) {
  throw new Error("PORT is not defined");
}
app.listen(PORT, () => {
  logger.info(`server running on port ${PORT}`);
});
