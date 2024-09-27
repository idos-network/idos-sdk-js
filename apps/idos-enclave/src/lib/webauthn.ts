import { encode as base64Encode } from "@stablelib/base64";
import { encode as utf8Encode } from "@stablelib/utf8";

export async function createNewCredential(secret: string): Promise<{
  password: string;
  credentialId: string;
} | null> {
  const displayName = "idOS User";

  const credentialCreationOptions: PublicKeyCredentialCreationOptions = {
    challenge: crypto.getRandomValues(new Uint8Array(10)),
    rp: { name: "idOS.network" },
    user: {
      id: utf8Encode(secret),
      displayName,
      name: displayName,
    },
    pubKeyCredParams: [
      {
        type: "public-key",
        alg: -7,
      },
    ],
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      userVerification: "required",
      residentKey: "preferred",
    },
  };

  try {
    const credential = (await navigator.credentials.create({
      publicKey: credentialCreationOptions,
    })) as PublicKeyCredential;
    const credentialId = base64Encode(new Uint8Array(credential.rawId));

    return { password: secret, credentialId };
  } catch (error) {
    throw Error("Error creating new credential");
  }
}
