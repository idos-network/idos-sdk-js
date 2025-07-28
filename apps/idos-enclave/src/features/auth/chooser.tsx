import type { EncryptionPasswordStore } from "@idos-network/utils/enclave";
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
    <div className="flex flex-col space-y-4 px-3 md:px-0">
      {mode === "existing" && (
        <>
          <Heading>Unlock your idOS key</Heading>

          <Paragraph>
            To continue, select the authentication method you chose when creating your idOS profile.
          </Paragraph>
        </>
      )}

      {mode === "new" && (
        <>
          <Heading>Create your idOS key</Heading>

          <Paragraph>
            This ensures your idOS data is safe and encrypted such that only you can read it.
          </Paragraph>

          <Paragraph>
            To continue, please choose your preferred authentication method below.
          </Paragraph>
        </>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {allowedEncryptionStores.includes("password") && (
          <Button id="auth-method-password" onClick={() => setEncryptionPasswordStore("password")}>
            Use a password
          </Button>
        )}

        {allowedEncryptionStores.includes("mpc") && (
          <Button id="auth-method-mpc" onClick={() => setEncryptionPasswordStore("mpc")}>
            Use MPC
          </Button>
        )}
      </div>
    </div>
  );
}
