import { useSignal } from "@preact/signals";

import type { Store } from "@idos-network/idos-store";
import { useMemo } from "preact/hooks";
import { Button } from "../../components/ui/button";
import { Heading } from "../../components/ui/heading";
import { Paragraph } from "../../components/ui/paragraph";
import { TextField } from "../../components/ui/text-field";
import { Lit, getAllowedWalletAddresses } from "../../lib/lit";

function GoogleDriveRecoveryMethod({
  onSuccess,
}: { onSuccess: ({ password }: { password: string }) => void }) {
  const recoveryMethod = useSignal<"password" | "secret">("password");
  const secret = useSignal<string>("");
  const passwordOrSecretKeyLabel = recoveryMethod.value === "password" ? "password" : "secret key";

  const handleSubmit = (event: Event) => {
    event.preventDefault();
    onSuccess({ password: secret.value });
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

function LitProtocolRecoveryMethod({ store, onSuccess }: PasswordOrKeyRecoveryProps) {
  const loading = useSignal(false);
  const litInstance = useMemo(() => new Lit("ethereum", store), [store]);
  const walletAddresses = useMemo(
    () => getAllowedWalletAddresses(store.get("lit-access-control") || []),
    [store],
  );

  const getLitStorage = () => {
    const ciphertext = store.get("lit-cipher-text");
    const dataToEncryptHash = store.get("lit-data-to-encrypt-hash");
    return { ciphertext, dataToEncryptHash };
  };

  const handleRecovery = async () => {
    try {
      loading.value = true;
      const { ciphertext, dataToEncryptHash } = await getLitStorage();
      const password = await litInstance.decrypt(ciphertext, dataToEncryptHash);
      if (!password) throw new Error("Failed to recover password");
      onSuccess({ password });
    } catch (error) {
      console.error(error);
    } finally {
      loading.value = false;
    }
  };

  return (
    <div class="flex flex-col gap-4">
      <Paragraph class="text-left">
        Get your idOS Credentials using Lit Protocol. A wallet signature is required to recover your
        passowrd.
      </Paragraph>
      <Paragraph class="text-left text-sm">
        Please Sign the message using one of the following wallets:
        <ul className="list-disc mt-3">
          {walletAddresses.map((wallet) => (
            <li key={wallet}>{wallet}</li>
          ))}
        </ul>
      </Paragraph>
      <Button onClick={handleRecovery} disabled={loading.value}>
        {loading.value ? "Recovering..." : "Recover"}
      </Button>
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

  const renderSrc: Record<string, React.ReactNode> = {
    google: <GoogleDriveRecoveryMethod onSuccess={onSuccess} />,
    lit: <LitProtocolRecoveryMethod store={store} onSuccess={onSuccess} />,
  };

  if (recoveryMode.value) {
    return renderSrc[recoveryMode.value] as React.ReactNode;
  }

  return (
    <div class="flex flex-col gap-4">
      <Heading>Forgot your password or secret key?</Heading>
      <Button
        onClick={() => {
          recoveryMode.value = "google";
        }}
      >
        Recover Google Drive Backup
      </Button>
      <Button
        disabled={!litCiphertext}
        onClick={() => {
          recoveryMode.value = "lit";
        }}
      >
        Recover using Lit Protocol
      </Button>
    </div>
  );
}
