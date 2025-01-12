import { serve } from "@hono/node-server";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import z from "zod";

const app = new Hono();

app.get("/", (c) => {
  return c.text("🚀");
});

app.post(
  "/",
  zValidator(
    "json",
    z.object({
      data_id: z.string().uuid(),
      ag_owner_wallet_identifier: z.string(),
      ag_grantee_wallet_identifier: z.string(),
      signature: z.string(),
      locked_until: z.literal(0),
      hash: z.string(),
    }),
  ),
  async (c) => {
    // Validate the incoming `dAG` payload.
    const {
      data_id,
      ag_owner_wallet_identifier,
      ag_grantee_wallet_identifier,
      signature,
      locked_until,
      hash,
    } = c.req.valid("json");

    // @todo: fetch the associated `Credential` from the idOS by `data_id`.

    // @todo: check that the `dAG` matches the hash of the retrieved `Credential`.

    // @todo: transmit the `dAG` to the idOS.

    return c.text(
      `🚀 ${data_id} ${ag_owner_wallet_identifier} ${ag_grantee_wallet_identifier} ${signature} ${locked_until} ${hash}`,
    );
  },
);

const port = 3000;

console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
