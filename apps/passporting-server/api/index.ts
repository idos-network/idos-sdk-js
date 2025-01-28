import { handle } from "@hono/node-server/vercel";
import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.json({ message: "🚀" });
});

export default handle(app);
