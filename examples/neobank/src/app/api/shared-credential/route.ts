import { type NextRequest, NextResponse } from "next/server";
import { idOSConsumer } from "@/consumer.config";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Credential ID and address are required" }, { status: 400 });
  }

  const consumer = await idOSConsumer();
  const credentials = await consumer.getCredentialsSharedByUser(userId);
  const [usableCredential] = credentials.filter(
    (credential) => credential.issuer_auth_public_key === process.env.NEXT_PUBLIC_IDOS_PUBLIC_KEY,
  );
  const issuerURL = process.env.KRAKEN_ISSUER;
  const publicKeyMultibase = process.env.KRAKEN_PUBLIC_KEY_MULTIBASE;

  if (!usableCredential)
    return NextResponse.json(
      { error: "No credential were shared with this user" },
      { status: 400 },
    );

  const credentialContent = await consumer.getSharedCredentialContentDecrypted(usableCredential.id);

  if (!credentialContent)
    return NextResponse.json({
      success: false,
      credential: null,
      message: "No credential found",
    });

  // @todo: some users can get their credentials from other issuers. meaning that verificationResult will be false. what should we do about that?
  const [verificationResult] = await consumer.verifyCredentials(JSON.parse(credentialContent), [
    {
      issuerURL,
      publicKeyMultibase,
    },
  ]);

  // @todo: what should we do about
  // if (!verificationResult) {
  //   return Response.json(
  //     { error: `Invalid credential signature for credential ${credentialId}` },
  //     { status: 400 },
  //   );
  // }

  return NextResponse.json({
    credentialContent: JSON.parse(credentialContent).credentialSubject,
    verificationResult,
    credentialId: usableCredential.id,
  });
}
