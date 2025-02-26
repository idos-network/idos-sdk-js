import { zValidator } from "@hono/zod-validator";
import { idOSGrantee as idOSGranteeClass } from "@idos-network/consumer-sdk-js/server";
import {
  type IssuerConfig,
  createAccessGrantFromDAG,
  createIssuerConfig,
} from "@idos-network/issuer-sdk-js/server";
import { decode } from "@stablelib/base64";
import { goTry } from "go-try";
import { Hono } from "hono";
import { env } from "hono/adapter";
import nacl from "tweetnacl";
import { z } from "zod";

import type { MiddlewareHandler } from "hono";
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

const addGrantee = createMiddleware<{
  Variables: {
    idOSGrantee: idOSGranteeClass;
  };
}>(async (c, next) => {
  const { KWIL_NODE_URL, ISSUER_SIGNING_SECRET_KEY, ISSUER_ENCRYPTION_SECRET_KEY } = env(
    c,
  ) as Record<string, string>;

  c.set(
    "idOSGrantee",
    await idOSGranteeClass.init({
      nodeUrl: KWIL_NODE_URL,
      granteeSigner: nacl.sign.keyPair.fromSecretKey(decode(ISSUER_SIGNING_SECRET_KEY)),
      recipientEncryptionPrivateKey: ISSUER_ENCRYPTION_SECRET_KEY,
    }),
  );

  await next();
});

app.post(
  "/mos-endpoint",
  authMiddleware,
  addGrantee,
  zValidator(
    "json",
    z.object({
      dag_data_id: z.string().uuid(),
    }),
  ),
  async (c) => {
    const { dag_data_id } = c.req.valid("json");

    const credential = await c.var.idOSGrantee.getReusableCredentialCompliantly(dag_data_id);

    if (!credential) {
      return c.json({ success: false, error: { message: "Credential not found" } }, 404);
    }

    return c.json({ credential }, 200);
  },
);

const addIssuerConfig = createMiddleware<{
  Variables: {
    issuerConfig: IssuerConfig;
  };
}>(async (c, next) => {
  const { KWIL_NODE_URL, ISSUER_SIGNING_SECRET_KEY, ISSUER_ENCRYPTION_SECRET_KEY } = env(
    c,
  ) as Record<string, string>;

  c.set(
    "issuerConfig",
    await createIssuerConfig({
      nodeUrl: KWIL_NODE_URL,
      signingKeyPair: nacl.sign.keyPair.fromSecretKey(decode(ISSUER_SIGNING_SECRET_KEY)),
      encryptionSecretKey: decode(ISSUER_ENCRYPTION_SECRET_KEY),
    }),
  );

  await next();
});

app.post(
  "/",
  authMiddleware,
  addIssuerConfig,
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
    const params = c.req.valid("json");

    const [error, _credential] = await goTry(() =>
      createAccessGrantFromDAG(c.var.issuerConfig, params),
    );

    if (error) {
      return c.json({ error }, 400);
    }

    return c.json({ dag_data_id: params.dag_data_id }, 200);
  },
);

export default app;
