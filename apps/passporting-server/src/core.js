import { zValidator } from "@hono/zod-validator";
import { idOSGrantee as idOSGranteeClass } from "@idos-network/consumer-sdk-js/server";
import { createAccessGrantFromDAG, createIssuerConfig } from "@idos-network/issuer-sdk-js/server";
import { decode } from "@stablelib/base64";
import { goTry } from "go-try";
import { Hono } from "hono";
import { env } from "hono/adapter";
import nacl from "tweetnacl";
import { z } from "zod";

import { createMiddleware } from "hono/factory";

const app = new Hono();

const authMiddleware = createMiddleware(async (c, next) => {
  const { CLIENT_SECRETS } = env(c);

  const bearer = c.req.header("Authorization")?.split(" ")[1];

  // @todo: additional logic to validate that the token is valid.
  // This is just a very basic validation of the token that assumes that we have a list of valid tokens.
  if (!bearer || !CLIENT_SECRETS.split(",").includes(bearer)) {
    return c.json({ success: false, error: { message: "Unauthorized request" } }, 401);
  }

  await next();
});

app.get("/", (c) => {
  return c.text("🚀");
});

app.post(
  "/mos-endpoint",
  authMiddleware,
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
    const { KWIL_NODE_URL, ISSUER_SIGNING_SECRET_KEY, ISSUER_ENCRYPTION_SECRET_KEY } = env(c);

    const granteeConfig = await idOSGranteeClass.init({
      nodeUrl: KWIL_NODE_URL,
      granteeSigner: nacl.sign.keyPair.fromSecretKey(decode(ISSUER_SIGNING_SECRET_KEY)),
      recipientEncryptionPrivateKey: decode(ISSUER_ENCRYPTION_SECRET_KEY),
    });

    const { dag_data_id } = c.req.valid("json");

    const credential = await granteeConfig.getReusableCredentialCompliantly(dag_data_id);

    if (!credential) {
      return c.json({ success: false, error: { message: "Credential not found" } }, 404);
    }

    return c.json({ success: true, data: { credential } }, 200);
  },
);

app.post(
  "/",
  authMiddleware,
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
    const { KWIL_NODE_URL, ISSUER_SIGNING_SECRET_KEY, ISSUER_ENCRYPTION_SECRET_KEY } = env(c);

    const issuerConfig = await createIssuerConfig({
      nodeUrl: KWIL_NODE_URL,
      signingKeyPair: nacl.sign.keyPair.fromSecretKey(decode(ISSUER_SIGNING_SECRET_KEY)),
      encryptionSecretKey: decode(ISSUER_ENCRYPTION_SECRET_KEY),
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

    // Transmit the `DAG` to the idOS and retrieve the relevant credential.
    const [error, _credential] = await goTry(() =>
      createAccessGrantFromDAG(issuerConfig, {
        dag_data_id,
        dag_owner_wallet_identifier,
        dag_grantee_wallet_identifier,
        dag_signature,
        dag_locked_until,
        dag_content_hash,
      }),
    );

    if (error) {
      return c.json({ success: false, error: { cause: error.cause, message: error.message } }, 400);
    }

    return c.json({ success: true, data: { dag_data_id } }, 200);
  },
);

export default app;
