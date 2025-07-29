import type { EncryptionPasswordStore } from "@idos-network/utils/enclave";
import { effect, useSignal } from "@preact/signals";
import type { UIMode } from "@/types";
import Chooser from "./chooser";
import PasswordForm from "./password-form";

export interface AuthMethodProps {
  allowedEncryptionStores: EncryptionPasswordStore[];
  encryptionPasswordStore: EncryptionPasswordStore | null;
  mode: UIMode;
  onSuccess: (result: {
    encryptionPasswordStore: EncryptionPasswordStore;
    password?: string;
    duration?: number;
  }) => void;
  encryptionPublicKey?: string;
  userId: string | null;
}

export default function AuthMethodChooser({
  mode,
  encryptionPublicKey,
  userId,
  onSuccess,
  allowedEncryptionStores,
  encryptionPasswordStore,
}: AuthMethodProps) {
  const currentPasswordStore = useSignal<EncryptionPasswordStore | null>(encryptionPasswordStore);

  effect(() => {
    if (!currentPasswordStore.value && allowedEncryptionStores.length === 1) {
      currentPasswordStore.value = allowedEncryptionStores[0];
    }
  });

  effect(() => {
    if (currentPasswordStore.value === "mpc" && allowedEncryptionStores.includes("mpc")) {
      // There is no next step, no password or duration
      onSuccess({ encryptionPasswordStore: currentPasswordStore.value });
    }
  });

  if (currentPasswordStore.value === "user") {
    return (
      <PasswordForm
        mode={mode}
        onSuccess={onSuccess}
        encryptionPublicKey={encryptionPublicKey}
        userId={userId}
      />
    );
  }

  return (
    <Chooser
      setEncryptionPasswordStore={(encryptionPasswordStore) => {
        currentPasswordStore.value = encryptionPasswordStore;
      }}
      mode={mode}
      allowedEncryptionStores={allowedEncryptionStores}
    />
  );
}
