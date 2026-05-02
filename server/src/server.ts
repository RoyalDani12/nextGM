import { env } from "./config/env.js";
import app from "./app.js";


let PORT: number = Number(env.PORT) || 3000

if (!env.PORT) {
  throw new Error("PORT is not defined");
}
app.listen(PORT, () => {
  console.log(`server connected and running on port ${PORT}`);
});
