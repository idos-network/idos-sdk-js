import * as Base64 from "@stablelib/base64";
import * as Utf8 from "@stablelib/utf8";

export async function getExistingCredentialById(credentialId?: string) {
  const credentialRequest: CredentialRequestOptions = {
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(10)),
    },
  };

  if (credentialId && credentialRequest.publicKey) {
    credentialRequest.publicKey.allowCredentials = [
      {
        type: "public-key" as const,
        id: Base64.decode(credentialId),
      },
    ];
  }

  try {
    const credential = (await navigator.credentials.get(credentialRequest)) as PublicKeyCredential;
    const response = credential.response as AuthenticatorAssertionResponse;
    const userHandle = response.userHandle;

    if (!userHandle) throw new Error("User handle is missing from the credential response");

    const password = Utf8.decode(new Uint8Array(userHandle));

    return { password, credentialId: Base64.encode(new Uint8Array(credential.rawId)) };
  } catch (error) {
    throw new Error(
      `Error getting existing credential: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
