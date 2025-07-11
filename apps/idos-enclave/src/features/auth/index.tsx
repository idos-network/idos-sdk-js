import { effect, useSignal } from "@preact/signals";

import type { AuthMethod, UIMode } from "@/types";

import Chooser from "./chooser";
import PasswordForm from "./password-form";

export interface AuthMethodProps {
  allowedAuthMethods: AuthMethod[];
  previouslyUsedAuthMethod: AuthMethod | null;
  mode: UIMode;
  onSuccess: (result: { authMethod: AuthMethod; password?: string; duration?: number }) => void;
  encryptionPublicKey?: string;
  userId: string | null;
}

export default function AuthMethodChooser({
  mode,
  encryptionPublicKey,
  userId,
  onSuccess,
  allowedAuthMethods,
  previouslyUsedAuthMethod,
}: AuthMethodProps) {
  const authMethod = useSignal<AuthMethod | null>(null);

  effect(() => {
    if (allowedAuthMethods.length === 1) {
      authMethod.value = allowedAuthMethods[0];
    }
  });

  effect(() => {
    if (authMethod.value === "mpc" && allowedAuthMethods.includes("mpc")) {
      // There is no next step, no password or duration
      onSuccess({ authMethod: authMethod.value });
    }
  });

  if (authMethod.value === "password") {
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
      setMethod={(method) => {
        authMethod.value = method;
      }}
      mode={mode}
      allowedAuthMethods={allowedAuthMethods}
      previouslyUsedAuthMethod={previouslyUsedAuthMethod}
    />
  );
}
