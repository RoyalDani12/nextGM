import app from "./app.js";

let PORT: number = Number(process.env.PORT) || 3000

if (!process.env.PORT) {
  throw new Error("PORT is not defined");
}
app.listen(PORT, () => {
  console.log(`server connected and running on port ${PORT}`);
});
