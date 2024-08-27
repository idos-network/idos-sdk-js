import { QuestionMarkCircleIcon } from "@heroicons/react/20/solid";
import * as Base64Codec from "@stablelib/base64";
import * as Utf8Codec from "@stablelib/utf8";
import { useCallback } from "preact/hooks";
import { Button } from "../../components/Button";
import { Collapsible } from "../../components/Collapsible";
import { Heading } from "../../components/Heading";
import { Paragraph } from "../../components/Paragraph";
import type { MethodProps } from "./Chooser";

export interface PasskeyProps extends MethodProps<{ password: string; credentialId?: string }> {}

const Passkey = ({ onSuccess, onError, store, mode }: PasskeyProps) => {
  const getExistingCredentialById = useCallback(async (credentialId?: string) => {
    const credentialRequest: CredentialRequestOptions = {
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(10)),
      },
    };

    if (credentialId && credentialRequest.publicKey) {
      credentialRequest.publicKey.allowCredentials = [
        {
          type: "public-key" as const,
          id: Base64Codec.decode(credentialId),
        },
      ];
    }

    try {
      const credential = (await navigator.credentials.get(
        credentialRequest,
      )) as PublicKeyCredential;
      const password = Utf8Codec.decode(
        // biome-ignore lint/style/noNonNullAssertion: TBD.
        new Uint8Array((credential.response as AuthenticatorAssertionResponse).userHandle!),
      );
      return { password, credentialId: Base64Codec.encode(new Uint8Array(credential.rawId)) };
    } catch (error) {
      throw Error("Error getting existing credential");
    }
  }, []);

  const createNewCredential = useCallback(async (): Promise<{
    password: string;
    credentialId: string;
  } | null> => {
    const displayName = "idOS User";
    const password = Base64Codec.encode(crypto.getRandomValues(new Uint8Array(32)));

    const credentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge: crypto.getRandomValues(new Uint8Array(10)),
      rp: { name: "idOS.network" },
      user: {
        id: Utf8Codec.encode(password),
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
      const credentialId = Base64Codec.encode(new Uint8Array(credential.rawId));

      store.set("credential-id", credentialId);
      store.set("password", password);

      return { password, credentialId };
    } catch (error) {
      throw Error("Error creating new credential");
    }
  }, [store]);

  const getOrCreateWebAuthnCredential = useCallback(async () => {
    const storedCredentialId = store.get("credential-id");

    try {
      const result =
        mode === "new"
          ? await createNewCredential()
          : await getExistingCredentialById(storedCredentialId);

      if (!result) throw new Error("Failed to get or create WebAuthn credential");

      store.set("password", result.password);
      store.set("credential-id", result.credentialId);
      return result;
    } catch (error) {
      throw new Error(`Failed to get or create WebAuthn credential: ${(error as Error).message}`);
    }
  }, [store, mode, getExistingCredentialById, createNewCredential]);

  const getPasskey = useCallback(async () => {
    try {
      const result = await getOrCreateWebAuthnCredential();

      if (!result) throw new Error("Failed to get or create passkey");

      onSuccess(result);
      store.set("preferred-auth-method", "passkey");
    } catch (e) {
      onError(e instanceof Error ? e : new Error(String(e)));
    }
  }, [onSuccess, onError, store, getOrCreateWebAuthnCredential]);

  return (
    <div className="flex flex-col space-y-4 px-3 md:px-0">
      {mode === "new" && (
        <>
          <Heading>Create your idOS key</Heading>
          <Paragraph>Please click the button below to create an idOS passkey.</Paragraph>
          <Button onClick={getPasskey}>Create passkey</Button>
          <Collapsible title="What is a passkey?" Icon={QuestionMarkCircleIcon}>
            <Paragraph>
              A passkey is an encrypted digital key you create using your fingerprint, face, or
              screen lock.
            </Paragraph>
            <Paragraph>
              With passkeys, you don't need to remember complex passwords. They are saved to your
              password manager, so you can sign in on other devices.
            </Paragraph>
          </Collapsible>
        </>
      )}
      {mode === "existing" && (
        <>
          <Heading>Unlock your idOS key</Heading>
          <Paragraph>Please click the button below to use your idOS passkey.</Paragraph>
          <Button onClick={getPasskey}>Unlock with passkey</Button>
        </>
      )}
    </div>
  );
};

export default Passkey;
