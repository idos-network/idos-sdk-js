import { QuestionMarkCircleIcon } from "@heroicons/react/20/solid";
import * as Base64Codec from "@stablelib/base64";
import * as Utf8Codec from "@stablelib/utf8";
import React from "preact/compat";
import { Button } from "../../components/Button";
import { Collapsible } from "../../components/Collapsible";
import { Heading } from "../../components/Heading";
import { Paragraph } from "../../components/Paragraph";
import { MethodProps } from "./Chooser";

export interface PasskeyProps extends MethodProps<{ password: string; credentialId?: string }> {
  type: "password" | "webauthn";
}

export default class Passkey extends React.Component<PasskeyProps> {
  getPasskey = async () => {
    const { type, onSuccess, onError, store } = this.props;

    try {
      if (type === "password") {
        const result = await this.getOrCreatePasswordCredential();
        onSuccess(result);
      } else if (type === "webauthn") {
        const result = await this.getOrCreateWebAuthnCredential();
        onSuccess(result);
      }

      store.set("preferred-auth-method", "webauthn");
    } catch (e: any) {
      onError(e);
    }
  };

  async getOrCreatePasswordCredential() {
    // @ts-expect-error Experimental functionality not yet typed
    const credential = await navigator.credentials.get({ password: true });

    // @ts-expect-error Experimental functionality not yet typed
    if (credential) return { password: credential.password };

    await navigator.credentials.store(
      // @ts-expect-error Experimental functionality not yet typed
      new PasswordCredential({
        id: "idos",
        name: "idOS user",
        password: Base64Codec.encode(crypto.getRandomValues(new Uint8Array(32))),
      }),
    );

    const password: string = await new Promise((resolve) =>
      setInterval(async () => {
        // @ts-expect-error Experimental functionality not yet typed
        const credential = await navigator.credentials.get({ password: true });
        // @ts-expect-error Experimental functionality not yet typed
        if (credential) resolve(credential.password);
      }, 100),
    );

    return { password };
  }

  async getOrCreateWebAuthnCredential() {
    let credential;
    let credentialId;
    let password;

    const { store } = this.props;

    const storedCredentialId = store.get("credential-id");

    if (storedCredentialId) {
      const credentialRequest = {
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(10)),
          allowCredentials: [
            {
              type: "public-key" as const,
              id: Base64Codec.decode(storedCredentialId),
            },
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
            residentKey: "preferred",
          },
        },
      };

      try {
        credential = await navigator.credentials.get(credentialRequest);
        // @ts-expect-error Experimental functionality not yet typed
        password = Utf8Codec.decode(new Uint8Array(credential.response.userHandle));
        // @ts-expect-error Experimental functionality not yet typed
        credentialId = Base64Codec.encode(new Uint8Array(credential.rawId));
      } catch (e) {}
    } else {
      const displayName = "idOS User";
      password = Base64Codec.encode(crypto.getRandomValues(new Uint8Array(32)));

      credential = await navigator.credentials.create({
        publicKey: {
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
        },
      });
    }

    if (!credential || !password) throw new Error("Failed to create credential");

    // @ts-expect-error Experimental functionality not yet typed
    credentialId = Base64Codec.encode(new Uint8Array(credential.rawId));

    store.set("credential-id", credentialId);
    store.set("password", password);

    return { password, credentialId };
  }

  render() {
    const { mode } = this.props;

    return (
      <div className="flex flex-col space-y-4 px-3 md:px-0">
        {mode === "new" && (
          <>
            <Heading>Create your idOS key</Heading>

            <Paragraph>Please click the button below to create an idOS passkey.</Paragraph>

            <Button onClick={this.getPasskey}>Create passkey</Button>

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

            <Button onClick={this.getPasskey}>Unlock with passkey</Button>
          </>
        )}
      </div>
    );
  }
}
