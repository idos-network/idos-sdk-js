import { userContext } from "~/middlewares/auth";
import { idOSConsumer } from "~/providers/idos.server";
import type { Route } from "./+types/data";

export async function loader({ request, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const credentialsId = url.searchParams.get("credentialsId");
  const user = context.get(userContext);

  if (!credentialsId || !user) {
    return Response.json({ error: "credentialsId or user is required" }, { status: 400 });
  }

  const grant = await idOSConsumer.getAccessGrantsForCredential(credentialsId);

  console.log("Grant: ", grant);

  // @ts-expect-error Missing types
  if (!grant || grant.inserter_id !== user.address) {
    return Response.json({ error: "grant not found" }, { status: 400 });
  }

  // Get data
  const credentialContents: string =
    await idOSConsumer.getSharedCredentialContentDecrypted(credentialsId);

  const data = JSON.parse(credentialContents);

  // Verify the credential
  const verificationResult = await idOSConsumer.verifyCredentials(data, [
    {
      issuer: "https://localhost:3000/idos",
      publicKeyMultibase: "z6MknvvLerVJyLVHvhU8evoB6udXU9Ueu6PGmaztwVarPBxQ",
    },
  ]);

  console.log("Verification result: ", verificationResult);

  return Response.json({ data });
}
