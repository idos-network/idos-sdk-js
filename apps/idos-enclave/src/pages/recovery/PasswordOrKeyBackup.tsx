import { CheckIcon, ClipboardIcon, EyeIcon } from "@heroicons/react/24/outline";
import type { Store } from "@idos-network/idos-store";
import type { EncryptResponse } from "@lit-protocol/types";
import { useSignal } from "@preact/signals";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { ethers } from "ethers";
import { type JSX, useEffect, useMemo } from "preact/compat";

import { EyeSlashIcon } from "@heroicons/react/20/solid";
import { Button } from "../../components/ui/button";
import { Heading } from "../../components/ui/heading";
import { Paragraph } from "../../components/ui/paragraph";
import { Lit } from "../../lib/lit";

function ClipboardCopyButton(props: JSX.HTMLAttributes<HTMLButtonElement>) {
  const clicked = useSignal(false);

  const handleClick = (event: JSX.TargetedMouseEvent<HTMLButtonElement>) => {
    clicked.value = true;
    props.onClick?.(event);
    setTimeout(() => {
      clicked.value = false;
    }, 2000);
  };

  return (
    <button
      type="button"
      class="text-green-500 transition-colors hover:text-green-700"
      {...props}
      onClick={handleClick}
    >
      {clicked.value ? (
        <CheckIcon class="h-6 w-6 text-green-700" />
      ) : (
        <ClipboardIcon class="h-6 w-6" />
      )}
    </button>
  );
}

function RevealButton(props: JSX.HTMLAttributes<HTMLButtonElement>) {
  const clicked = useSignal(false);

  const handleClick = (event: JSX.TargetedMouseEvent<HTMLButtonElement>) => {
    clicked.value = !clicked.value;
    props.onClick?.(event);
  };

  return (
    <button
      type="button"
      class="text-green-500 transition-colors hover:text-green-700"
      {...props}
      onClick={handleClick}
    >
      {clicked.value ? (
        <EyeSlashIcon class="h-6 w-6 text-green-700" />
      ) : (
        <EyeIcon class="h-6 w-6" />
      )}
    </button>
  );
}

function ReadonlyInput(props: JSX.HTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="text"
      readOnly
      class="flex-1 border-0 bg-transparent font-semibold outline-none ring-0 focus:outline-none focus:ring-0"
      {...props}
    />
  );
}

function ReadonlyField(props: JSX.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      class="flex items-center justify-between gap-5 rounded-md border-2 border-green-400 px-2 py-1"
      {...props}
    />
  );
}

interface PasswordAndSecretRevealProps {
  password: string;
  secret: string;
  onCancel: () => void;
  store: Store;
  litInstance: Lit;
}

function PasswordAndSecretReveal({
  password,
  secret,
  onCancel,
  litInstance,
  store,
}: PasswordAndSecretRevealProps) {
  const revealPassword = useSignal(false);
  const revealSecret = useSignal(false);

  const handleCopyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch (error) {
      console.error("Failed to copy to clipboard", error);
    }
  };

  const handleLitRetrival = async () => {
    const litCipher = store.get("lit-cipher-text");
    const litDataHash = store.get("lit-data-to-encrypt-hash");
    const litAccessControls = store.get("lit-access-control");

    if (!litCipher) return;
    const password = await litInstance.decrypt(litCipher, litDataHash, litAccessControls);
    alert(`your password is ${password}`);
  };

  return (
    <div class="flex flex-col gap-4 text-left">
      <div class="flex flex-col gap-1">
        <Paragraph>Your password is:</Paragraph>
        <ReadonlyField>
          <ReadonlyInput type={revealPassword.value ? "text" : "password"} value={password} />
          <div className="flex items-center gap-2">
            <RevealButton
              onClick={() => {
                revealPassword.value = !revealPassword.value;
              }}
            />
            <ClipboardCopyButton onClick={() => handleCopyToClipboard(password)} />
          </div>
        </ReadonlyField>
      </div>
      <div class="flex flex-col gap-1">
        <Paragraph>Your secret key is:</Paragraph>
        <ReadonlyField>
          <ReadonlyInput type={revealSecret.value ? "text" : "password"} value={secret} />
          <div className="flex items-center gap-2">
            <RevealButton
              onClick={() => {
                revealSecret.value = !revealSecret.value;
              }}
            />
            <ClipboardCopyButton onClick={() => handleCopyToClipboard(secret)} />
          </div>
        </ReadonlyField>
      </div>
      <Button onClick={onCancel}>Go back</Button>
    </div>
  );
}

interface GoogleDocsStoreProps {
  password: string;
  secret: string;
}

function GoogleDocsStore({ password, secret }: GoogleDocsStoreProps) {
  const status = useSignal<"idle" | "pending" | "success" | "error">("idle");
  const documentId = useSignal("");

  const handleGoogleDocsStore = useGoogleLogin({
    onSuccess: async ({ access_token }) => {
      status.value = "pending";
      try {
        const response = await fetch("https://docs.googleapis.com/v1/documents", {
          method: "POST",
          headers: new Headers({
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({
            title: "idOS Credentials",
          }),
        });

        const body = await response.json();
        documentId.value = body.documentId;

        await fetch(`https://docs.googleapis.com/v1/documents/${documentId.value}:batchUpdate`, {
          method: "POST",
          headers: new Headers({
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({
            requests: [
              {
                insertText: {
                  location: {
                    index: 1,
                  },
                  text: "\n",
                },
              },
              {
                insertText: {
                  location: {
                    index: 1,
                  },
                  text: `\nidOS Secret: ${secret}\n`,
                },
              },
              {
                insertText: {
                  location: {
                    index: 2,
                  },
                  text: `\nidOS Password: ${password}\n`,
                },
              },
            ],
          }),
        });

        status.value = "success";
      } catch (error) {
        status.value = "error";
        throw new Error("Failed to store credentials on Google Drive");
      }
    },
    prompt: "consent",
    scope: "https://www.googleapis.com/auth/drive.file",
  });

  return (
    <div class="flex flex-col gap-2">
      <Button onClick={() => handleGoogleDocsStore()} disabled={status.value === "pending"}>
        {status.value === "pending" ? "Storing..." : "Store securely on Google Drive"}
      </Button>
      {status.value === "success" ? (
        <Paragraph>
          Your credentials have been successfully stored. You can access them{" "}
          <a
            href={`https://docs.google.com/document/d/${documentId.value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-500 hover:underline"
          >
            here
          </a>
          .
        </Paragraph>
      ) : null}
    </div>
  );
}

export function PasswordOrKeyBackup({
  store,
  backupStatus,
  onSuccess,
}: {
  store: Store;
  backupStatus: "done" | "pending" | "success" | "failure";
  onSuccess: (result: unknown) => void;
}) {
  const reveal = useSignal(false);
  const status = useSignal<"idle" | "pending">("idle");
  const litInstance = useMemo(() => new Lit("ethereum", store), [store]);
  const litCipher = store.get("lit-cipher-text");

  const password = store.get("password");
  const secret = store.get("encryption-private-key");

  const handleReveal = () => {
    reveal.value = !reveal.value;
  };

  const handleDownload = () => {
    const content = `Password: ${password}\nSecret: ${secret}`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "idOS_credentials.txt";

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const storeLitCiphers = async (cipherInfo: EncryptResponse) => {
    const { ciphertext, dataToEncryptHash } = cipherInfo;
    // accessControlConditions already been stored
    store.set("lit-cipher-text", ciphertext);
    store.set("lit-data-to-encrypt-hash", dataToEncryptHash);
  };

  const storeWithLit = async () => {
    status.value = "pending";
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const address = await signer.getAddress();

    const passwordCiphers = await litInstance.encrypt(password, [address]);
    const secretCiphers = await litInstance.encrypt(secret, [address]);
    const accessControlConditions = litInstance.getAccessControls();

    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    storeLitCiphers(passwordCiphers!);

    onSuccess({
      type: "idOS:store",
      status: "pending",
      payload: {
        passwordCiphers,
        secretCiphers,
        accessControlConditions,
      },
    });
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (["failure", "done", "success"].includes(backupStatus)) {
      status.value = "idle";
    }
  }, [backupStatus]);

  const hideStoreWithLit = backupStatus === "success" && !!litCipher;

  if (reveal.value) {
    return (
      <PasswordAndSecretReveal
        {...{ password, secret }}
        onCancel={handleReveal}
        store={store}
        litInstance={litInstance}
      />
    );
  }

  return (
    <div class="flex flex-col gap-5">
      <Heading>Back up your password or secret key</Heading>
      <Button onClick={handleReveal}>Reveal password / secret key</Button>
      <Button onClick={handleDownload}>Download password / secret key</Button>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <GoogleDocsStore {...{ password, secret }} />
      </GoogleOAuthProvider>
      {!hideStoreWithLit && (
        <Button onClick={storeWithLit} disabled={status.value === "pending"}>
          {status.value === "pending" ? "Storing..." : "Store securely on the idOS"}
        </Button>
      )}
      {backupStatus === "success" ? (
        <Paragraph>
          Your credentials have been successfully stored. You can close this window now.
        </Paragraph>
      ) : null}
    </div>
  );
}
