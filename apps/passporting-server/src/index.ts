import { serve } from "@hono/node-server";
import { zValidator } from "@hono/zod-validator";
import { base64Decode } from "@idos-network/codecs";
import { createAccessGrantFromDAG, createIssuerConfig } from "@idos-network/issuer-sdk-js";
import { Hono } from "hono";
import { env } from "hono/adapter";
import nacl from "tweetnacl";
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
      dag_data_id: z.string().uuid(),
      dag_owner_wallet_identifier: z.string(),
      dag_grantee_wallet_identifier: z.string(),
      dag_signature: z.string(),
      dag_locked_until: z.number(),
      dag_content_hash: z.string(),
    }),
  ),
  async (c) => {
    const { KWIL_NODE_URL, ISSUER_SIGNING_SECRET_KEY, ISSUER_ENCRYPTION_SECRET_KEY } = env<{
      KWIL_NODE_URL: string;
      ISSUER_SIGNING_SECRET_KEY: string;
      ISSUER_ENCRYPTION_SECRET_KEY: string;
    }>(c);
    const issuerConfig = await createIssuerConfig({
      nodeUrl: KWIL_NODE_URL,
      signingKeyPair: nacl.sign.keyPair.fromSecretKey(base64Decode(ISSUER_SIGNING_SECRET_KEY)),
      encryptionSecretKey: base64Decode(ISSUER_ENCRYPTION_SECRET_KEY),
    });

    // Validate the incoming `DAG` payload.
    const {
      dag_data_id,
      dag_owner_wallet_identifier,
      dag_grantee_wallet_identifier,
      dag_signature,
      dag_locked_until,
      dag_content_hash,
    } = c.req.valid("json");

    // Transmit the `DAG` to the idOS.
    await createAccessGrantFromDAG(issuerConfig, {
      dag_data_id,
      dag_owner_wallet_identifier,
      dag_grantee_wallet_identifier,
      dag_signature,
      dag_locked_until,
      dag_content_hash,
    });

    return c.json({
      success: true,
    });
  },
);

const port = 3000;

console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
