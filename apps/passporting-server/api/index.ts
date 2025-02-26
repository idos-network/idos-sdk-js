import { handle } from "@hono/node-server/vercel";
import app from "../src/core.ts";

export default handle(app);
