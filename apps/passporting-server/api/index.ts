import { handle } from "@hono/node-server/vercel";
import app from "../src/core";

export default handle(app);
