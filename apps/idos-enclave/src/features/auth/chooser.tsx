import type { EncryptionPasswordStore } from "@idos-network/utils/enclave";
import { KeyRoundIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Paragraph } from "@/components/ui/paragraph";
import type { UIMode } from "@/types";

export interface ChooserProps {
  mode: UIMode;
  allowedEncryptionStores: EncryptionPasswordStore[];
  setEncryptionPasswordStore: (encryptionPasswordStore: EncryptionPasswordStore) => void;
}

export default function Chooser({
  mode,
  allowedEncryptionStores,
  setEncryptionPasswordStore,
}: ChooserProps) {
  return (
    <div className="flex flex-col gap-6">
      {mode === "existing" && (
        <div className="flex flex-col items-center gap-6">
          <Heading>Unlock your idOS key</Heading>

          <Paragraph>
            To continue, select the authentication method you chose when creating your idOS profile.
          </Paragraph>
        </div>
      )}

      {mode === "new" && (
        <div className="flex flex-col gap-6">
          <Heading>Create your idOS encryption key</Heading>

          <Paragraph>
            To continue,{" "}
            <a
              href="https://docs.idos.network/how-it-works/key-flows/encryption-flows"
              target="_blank"
              class="text-primary"
              rel="noopener"
            >
              sign with your wallet
            </a>{" "}
            (recommended) or create a password
          </Paragraph>

          <div class="rounded-xl bg-muted p-4">
            <div class="flex items-center gap-4">
              <span class="text-primary">
                <KeyRoundIcon size={32} />
              </span>
              <p class="text-xs">
                This ensures your idOS data is safe and encrypted such that only you or those you
                grant access to can access it.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {allowedEncryptionStores.includes("mpc") && (
          <Button id="auth-method-mpc" onClick={() => setEncryptionPasswordStore("mpc")}>
            Sign with your wallet
          </Button>
        )}

        {allowedEncryptionStores.includes("user") && (
          <Button
            id="auth-method-password"
            variant="link"
            onClick={() => setEncryptionPasswordStore("user")}
          >
            Create a password instead
          </Button>
        )}
      </div>
    </div>
  );
}
