import { idOSConsumer } from "@idos-network/consumer";
import type { NextRequest } from "next/server";
import invariant from "tiny-invariant";

export async function GET(request: NextRequest) {
  const nodeUrl = process.env.IDOS_NODE_URL;
  const consumerSigner = process.env.IDOS_CONSUMER_SIGNER;
  const recipientEncryptionPrivateKey = process.env.IDOS_RECIPIENT_ENCRYPTION_PRIVATE_KEY;
  const issuer = process.env.KRAKEN_ISSUER;
  const publicKeyMultibase = process.env.KRAKEN_PUBLIC_KEY_MULTIBASE;

  invariant(nodeUrl, "`IDOS_NODE_URL` is not set");
  invariant(consumerSigner, "`IDOS_CONSUMER_SIGNER` is not set");
  invariant(recipientEncryptionPrivateKey, "`IDOS_RECIPIENT_ENCRYPTION_PRIVATE_KEY` is not set");
  invariant(issuer, "`KRAKEN_ISSUER` is not set");
  invariant(publicKeyMultibase, "`KRAKEN_PUBLIC_KEY_MULTIBASE` is not set");

  const { searchParams } = new URL(request.url);
  const credentialId = searchParams.get("credentialId");
  const inserterId = searchParams.get("inserterId");

  if (!credentialId) {
    return Response.json({ error: "`credentialId` search param is required" }, { status: 400 });
  }

  if (!inserterId) {
    return Response.json({ error: "`inserterId` search param is not supported" }, { status: 400 });
  }

  const consumer = await idOSConsumer.init({
    nodeUrl,
    consumerSigner,
    recipientEncryptionPrivateKey,
  });
  const accessGrant = await consumer.getAccessGrantsForCredential(credentialId);

  if (!accessGrant) {
    return Response.json(
      { error: `Access Grant for credential ${credentialId} not found` },
      { status: 404 },
    );
  }

  // biome-ignore lint/suspicious/noExplicitAny: need to check what is going on with this. We don't have this defined in the types.
  const accessGrantInserter = (accessGrant as any).inserter_id;

  if (inserterId && accessGrantInserter !== inserterId) {
    return Response.json({ error: `Invalid inserter id: ${accessGrantInserter}` }, { status: 400 });
  }

  const credentialContents: string =
    await consumer.getSharedCredentialContentDecrypted(credentialId);

  const credentialData = JSON.parse(credentialContents);

  const verificationResult = await consumer.verifyCredentials(credentialData, [
    {
      issuer,
      publicKeyMultibase,
    },
  ]);

  if (!verificationResult) {
    return Response.json(
      { error: `Invalid credential signature for credential ${credentialId}` },
      { status: 400 },
    );
  }

  return Response.json(credentialData);
}
