import { useSignal } from "@preact/signals";

import type { Store } from "@idos-network/idos-store";
import { useMemo } from "preact/hooks";
import { Button } from "../../components/ui/button";
import { Heading } from "../../components/ui/heading";
import { Paragraph } from "../../components/ui/paragraph";
import { TextField } from "../../components/ui/text-field";
import { Lit, getAllowedWalletAddresses } from "../../lib/lit";
import { createNewCredential } from "../../lib/webauthn";
import { PasswordOrSecretReveal } from "./PasswordOrKeyBackup";

interface GoogleDriveRecoveryMethodProps {
  onSuccess: ({ credentialId, password }: { credentialId?: string; password: string }) => void;
}

function GoogleDriveRecoveryMethod({ onSuccess }: GoogleDriveRecoveryMethodProps) {
  const recoveryMethod = useSignal<"password" | "secret">("password");
  const secret = useSignal<string>("");
  const passwordOrSecretKeyLabel = recoveryMethod.value === "password" ? "password" : "secret key";

  const handleSubmit = async (event: Event) => {
    event.preventDefault();

    if (recoveryMethod.value === "password") {
      return onSuccess({ password: secret.value });
    }

    const credential = await createNewCredential(secret.value);

    if (credential) {
      onSuccess({
        credentialId: credential.credentialId,
        password: credential.password,
      });
    }
  };

  return (
    <form class="flex flex-col gap-4" onSubmit={handleSubmit}>
      <Paragraph class="text-left">
        <a
          href="https://drive.google.com/drive/search?q=%22idOS%20Credentials%22"
          target="_blank"
          rel="noreferrer"
          class="text-green-500 underline underline-offset-4 transition-colors hover:text-green-700"
        >
          Find the idOS Credentials document
        </a>{" "}
        in your Google Drive.
      </Paragraph>

      <div className="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input
              type="radio"
              name="recovery"
              id="password"
              class="form-radio cursor-pointer text-green-400 focus:ring-green-500"
              value="password"
              checked={recoveryMethod.value === "password"}
              onInput={() => {
                recoveryMethod.value = "password";
              }}
            />
            <label for="password">Use your password</label>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="recovery"
                id="secret-key"
                class="form-radio cursor-pointer text-green-400 focus:ring-green-500"
                value="secret-key"
                checked={recoveryMethod.value === "secret"}
                onInput={() => {
                  recoveryMethod.value = "secret";
                }}
              />
              <label for="secret-key">Use your secret key</label>
            </div>
          </div>
        </div>
        <div class="flex flex-col items-stretch justify-start gap-2">
          <label for="secret" class="text-left">
            Enter your {passwordOrSecretKeyLabel}:
          </label>
          <TextField
            id="secret"
            type="password"
            required
            value={secret}
            onInput={(e) => {
              secret.value = (e.target as HTMLInputElement).value;
            }}
          />
        </div>
        <Button type="submit">Recover</Button>
      </div>
    </form>
  );
}

export interface LitProtocolRecoveryMethodProps {
  store: Store;
  onSuccess: ({ credentialId, password }: { credentialId?: string; password: string }) => void;
}

function LitProtocolRecoveryMethod({ store, onSuccess }: LitProtocolRecoveryMethodProps) {
  const loading = useSignal(false);
  const litInstance = useMemo(() => new Lit("ethereum", store), [store]);
  const walletAddresses = useMemo(
    () => getAllowedWalletAddresses(store.get("lit-access-control") || []),
    [store],
  );

  const passwordSignal = useSignal("");

  const getLitStorage = () => {
    const ciphertext = store.get("lit-cipher-text");
    const dataToEncryptHash = store.get("lit-data-to-encrypt-hash");
    return { ciphertext, dataToEncryptHash };
  };

  const handleRecovery = async () => {
    try {
      loading.value = true;
      const { ciphertext, dataToEncryptHash } = getLitStorage();
      const password = await litInstance.decrypt(ciphertext, dataToEncryptHash);

      if (!password) throw new Error("Failed to recover password");

      passwordSignal.value = password;
    } catch (error) {
      console.error(error);
    } finally {
      loading.value = false;
    }
  };

  const handleCreatePasskey = async () => {
    const credential = await createNewCredential(passwordSignal.value);
    if (credential) {
      onSuccess({
        credentialId: credential.credentialId,
        password: credential.password,
      });
    }
  };

  const handleUnlock = async () => {
    onSuccess({
      password: passwordSignal.value,
    });
  };

  return (
    <div class="flex flex-col gap-4">
      <Paragraph class="text-left">
        Get your idOS Credentials using Lit Protocol. A wallet signature is required to recover your
        password.
      </Paragraph>
      <Paragraph class="text-left text-sm">
        Please sign the message using one of the following wallets:
        <ul className="mt-3 list-disc">
          {walletAddresses.map((wallet) => (
            <li key={wallet}>{wallet}</li>
          ))}
        </ul>
      </Paragraph>
      {passwordSignal.value ? (
        <>
          <PasswordOrSecretReveal authMethod="secret key" secret={passwordSignal.value} />
          <div className="flex items-stretch gap-4">
            <Button class="flex-1" onClick={handleUnlock}>
              Unlock
            </Button>
            <Button
              class="flex-1"
              onClick={handleCreatePasskey}
              variant="secondary"
              disabled={loading.value}
            >
              Create a passkey
            </Button>
          </div>
        </>
      ) : (
        <Button onClick={handleRecovery} disabled={loading.value}>
          {loading.value ? "Recovering..." : "Recover"}
        </Button>
      )}
    </div>
  );
}

export interface PasswordOrKeyRecoveryProps {
  onSuccess: ({ password }: { password: string }) => void;
  store: Store;
}

export function PasswordOrKeyRecovery({ onSuccess, store }: PasswordOrKeyRecoveryProps) {
  const recoveryMode = useSignal<"google" | "lit">();
  const litCiphertext = store.get("lit-cipher-text");
  const enableGoogleRecovery = false;

  if (recoveryMode.value === "google") {
    return <GoogleDriveRecoveryMethod onSuccess={onSuccess} />;
  }

  if (recoveryMode.value === "lit") {
    return <LitProtocolRecoveryMethod store={store} onSuccess={onSuccess} />;
  }

  return (
    <div class="flex flex-col gap-4">
      <Heading>Forgot?</Heading>
      {enableGoogleRecovery ? (
        <Button
          onClick={() => {
            recoveryMode.value = "google";
          }}
        >
          Recover Google Drive Backup
        </Button>
      ) : null}
      <Button
        onClick={() => {
          recoveryMode.value = "lit";
        }}
      >
        Recover using Lit Protocol
      </Button>
    </div>
  );
}
