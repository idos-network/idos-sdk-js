import { handle } from "@hono/node-server/vercel";
import app from "../src/core";

const handler = handle(app);

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const OPTIONS = handler;
