import { handle } from "@hono/node-server/vercel";
import app from "../src/core.js";

export default handle(app);
