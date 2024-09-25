import { type Signal, useSignal } from "@preact/signals";
import { encode } from "@stablelib/base64";
import nacl from "tweetnacl";

import { useMemo } from "preact/hooks";
import { Button } from "../../components/ui/button";
import { Heading } from "../../components/ui/heading";
import { Paragraph } from "../../components/ui/paragraph";
import { TextField, type TextFieldProps } from "../../components/ui/text-field";
import { idOSKeyDerivation } from "../../lib/idOSKeyDerivation";
import { Lit } from "../../lib/lit";
import type { MethodProps } from "./Chooser";

interface PasswordFieldProps extends Omit<TextFieldProps, "value" | "onInput"> {
  hasError?: Signal<boolean>;
  password: Signal<string>;
}

function PasswordField({ hasError, password, ...props }: PasswordFieldProps) {
  return (
    <div class="flex flex-col gap-1">
      <TextField
        id="idos-password-input"
        autoFocus
        type="password"
        required={true}
        value={password.value}
        onInput={(e) => {
          password.value = (e.target as HTMLInputElement).value;
        }}
        {...props}
      />
      {hasError?.value ? (
        <p class="tex-sm text-left font-semibold text-red-500">Invalid password.</p>
      ) : null}
    </div>
  );
}

interface DurationFieldProps {
  duration: Signal<number>;
}

function DurationField({ duration }: DurationFieldProps) {
  return (
    <div className="flex flex-col">
      <p className="text-left font-semibold">Remember for:</p>
      <div class="mt-2 flex items-center gap-x-6">
        <label className="flex cursor-pointer items-center gap-x-2">
          <input
            type="radio"
            name="duration"
            value="7"
            class="form-radio cursor-pointer text-green-400 focus:ring-green-500"
            checked={duration.value === 7}
            onInput={() => {
              duration.value = 7;
            }}
          />
          <span>1 week</span>
        </label>
        <label className="flex cursor-pointer items-center gap-x-2">
          <input
            type="radio"
            name="duration"
            value="30"
            class="form-radio cursor-pointer text-green-400 focus:ring-green-500"
            checked={duration.value === 30}
            onInput={() => {
              duration.value = 30;
            }}
          />
          <span>1 month</span>
        </label>
      </div>
    </div>
  );
}

export function PasswordForm({
  mode,
  onSuccess,
  store,
  encryptionPublicKey,
  humanId,
}: MethodProps<{ password: string; duration: number }> & {
  encryptionPublicKey: string;
  humanId: string | null;
}) {
  const password = useSignal("");
  const duration = useSignal(7);
  const hasError = useSignal(false);
  const isLoading = useSignal(false);
  const litInstance = useMemo(() => new Lit("ethereum", store), [store]);
  const litCipher = store.get("lit-cipher-text");

  async function derivePublicKeyFromPassword(password: string) {
    const salt = store.get("human-id") || humanId;
    const secretKey = await idOSKeyDerivation({ password, salt });
    const keyPair = nacl.box.keyPair.fromSecretKey(secretKey);
    return encode(keyPair.publicKey);
  }

  const restorePassword = async () => {
    const litDataHash = store.get("lit-data-to-encrypt-hash");
    const litAccessControls = store.get("lit-access-control");
    const decryptedPassword = await litInstance.decrypt(litCipher, litDataHash, litAccessControls);
    password.value = decryptedPassword || "";
  };

  const onSubmit = async (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    isLoading.value = true;

    if (encryptionPublicKey) {
      const derivedPK = await derivePublicKeyFromPassword(password.value);
      if (derivedPK !== encryptionPublicKey) {
        hasError.value = true;
        isLoading.value = false;
        return;
      }
    }

    hasError.value = false;
    isLoading.value = false;
    store.set("preferred-auth-method", "password");

    onSuccess({ password: password.value, duration: duration.value });
  };

  return (
    <form className="flex flex-col space-y-4 px-5 md:px-0" onSubmit={onSubmit}>
      {mode === "new" ? (
        <>
          <Heading>Create your idOS key</Heading>
          <Paragraph>
            Please choose a secure password, store it safely, and enter it below:
          </Paragraph>

          <PasswordField password={password} hasError={hasError} />

          <DurationField duration={duration} />

          <Paragraph>
            This password is the key to your idOS data. Be careful not to lose it: you'll need it
            later to view or share you idOS data.
          </Paragraph>

          <Button type="submit">Create password</Button>
        </>
      ) : (
        <>
          <Heading>Unlock your idOS key</Heading>

          <Paragraph>Please enter your idOS password below:</Paragraph>

          <PasswordField password={password} hasError={hasError} />

          <div className="flex items-center justify-between">
            <DurationField duration={duration} />
          </div>

          <Button type="submit" disabled={isLoading.value}>
            {isLoading.value ? "Unlocking..." : "Unlock"}
          </Button>
          {!!litCipher && (
            <button
              type="button"
              onClick={restorePassword}
              className="cursor-pointer font-semibold text-green-600 text-sm hover:underline"
            >
              Forgot your password? If you used Lit, click here to recover.
            </button>
          )}
        </>
      )}
    </form>
  );
}
