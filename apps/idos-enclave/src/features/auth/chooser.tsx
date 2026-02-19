import type { EncryptionPasswordStore } from "@idos-network/enclave";
import { KeyRoundIcon } from "lucide-preact";
import { Button } from "@/components/ui/button";
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
          <h1 className="text-center font-medium text-lg text-foreground">Unlock your idOS key</h1>

          <p className="text-center text-sm">
            To continue, select the authentication method you chose when creating your idOS profile.
          </p>
        </div>
      )}

      {mode === "new" && (
        <div className="flex flex-col gap-6">
          <h1 className="text-center font-medium text-lg text-foreground">
            Create your idOS encryption key
          </h1>

          <p className="text-center text-sm">
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
          </p>

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
