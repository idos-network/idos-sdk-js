import { zValidator } from "@hono/zod-validator";
import { idOSIssuer } from "@idos-network/issuer";
import { decode as base64Decode, encode as base64Encode } from "@stablelib/base64";
import { decode as utf8Decode, encode as utf8Encode } from "@stablelib/utf8";
import { goTry } from "go-try";
import { Hono } from "hono";
import { env } from "hono/adapter";
import nacl from "tweetnacl";
import { z } from "zod";

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
      message: z.string(),
    }),
  ),
  async (c) => {
    const { KWIL_NODE_URL, ISSUER_SIGNING_SECRET_KEY, ISSUER_ENCRYPTION_SECRET_KEY } = env(c);

    const issuer = await idOSIssuer.init({
      nodeUrl: KWIL_NODE_URL,
      signingKeyPair: nacl.sign.keyPair.fromSecretKey(base64Decode(ISSUER_SIGNING_SECRET_KEY)),
      encryptionSecretKey: base64Decode(ISSUER_ENCRYPTION_SECRET_KEY),
    });

    const [_, signerPublicKey, signature] = c.req.header("Authorization")?.split(" ") ?? [];
    const { message } = c.req.valid("json");

    // First check if we have the required authorization header
    if (!signerPublicKey || !signature) {
      return c.json(
        {
          success: false,
          error: {
            message: "Missing authorization header",
          },
        },
        401,
      );
    }

    // Then check if the public key is authorized
    const peers = await issuer.getPassportingPeers();
    if (!peers.some((publicKey) => publicKey === signerPublicKey)) {
      return c.json(
        {
          success: false,
          error: {
            message: "Unauthorized",
          },
        },
        401,
      );
    }

    // Finally verify the ed25519 signature
    const signatureBytes = base64Decode(signature);
    const publicKeyBytes = base64Decode(signerPublicKey);
    const messageBytes = utf8Encode(message);

    const isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);

    if (!isValid) {
      return c.json(
        {
          success: false,
          error: {
            message: "Invalid signature",
          },
        },
        401,
      );
    }

    // Validate the incoming `DAG` payload.
    const {
      dag_data_id,
      dag_owner_wallet_identifier,
      dag_grantee_wallet_identifier,
      dag_signature,
      dag_locked_until,
      dag_content_hash,
    } = c.req.valid("json");

    // Transmit the `DAG` to idOS.
    const [error, response] = await goTry(() =>
      issuer.createAccessGrantFromDAG({
        dag_data_id,
        dag_owner_wallet_identifier,
        dag_grantee_wallet_identifier,
        dag_signature,
        dag_locked_until,
        dag_content_hash,
      }),
    );

    if (error) {
      return c.json(
        {
          success: false,
          error: {
            cause: error.cause,
            message: error.message,
          },
        },
        400,
      );
    }

    return c.json({
      success: true,
      data: {
        dag_data_id,
      },
    });
  },
);

export default app;
