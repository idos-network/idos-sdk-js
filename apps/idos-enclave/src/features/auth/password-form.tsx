import { keyDerivation } from "@idos-network/utils/encryption";
import { type Signal, useSignal } from "@preact/signals";
import { encode } from "@stablelib/base64";
import { CircleAlertIcon, EyeIcon, EyeOffIcon } from "lucide-preact";
import nacl from "tweetnacl";

import type { UIMode } from "@/types";

import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Paragraph } from "@/components/ui/paragraph";
import { TextField, type TextFieldProps } from "@/components/ui/text-field";

interface PasswordFieldProps extends Omit<TextFieldProps, "value" | "onInput"> {
  hasError?: Signal<boolean>;
  password: Signal<string>;
  showPassword: Signal<boolean>;
}

function PasswordField({ hasError, password, showPassword, ...props }: PasswordFieldProps) {
  return (
    <div class="flex flex-col gap-1">
      <div class="relative">
        <TextField
          id="idos-password-input"
          className="w-full"
          // oxlint-disable-next-line jsx-a11y/no-autofocus -- Password field should auto-focus on mount
          autoFocus
          required={true}
          value={password.value}
          type={showPassword.value ? "text" : "password"}
          onInput={(e) => {
            password.value = (e.target as HTMLInputElement).value;
            if (hasError?.value) hasError.value = false;
          }}
          {...props}
        />
        <button
          type="button"
          aria-label={showPassword.value ? "Hide password" : "Show password"}
          class="bg-muted absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer p-2"
          onClick={() => {
            showPassword.value = !showPassword.value;
          }}
        >
          {showPassword.value ? (
            <EyeIcon className="text-foreground" />
          ) : (
            <EyeOffIcon className="text-muted-foreground" />
          )}
        </button>
      </div>
      {hasError?.value ? (
        <p class="text-left text-sm font-semibold text-red-500">Invalid password.</p>
      ) : null}
    </div>
  );
}

interface DurationFieldProps {
  duration: Signal<number>;
}

function DurationField({ duration }: DurationFieldProps) {
  return (
    <div className="flex justify-between gap-5">
      <p className="text-left text-sm font-medium">Remember for:</p>
      <div class="flex items-center gap-x-6">
        <label className="flex cursor-pointer items-center gap-x-2">
          <input
            type="radio"
            name="duration"
            value="7"
            class="form-radio text-primary focus:ring-primary/50 cursor-pointer"
            checked={duration.value === 7}
            onInput={() => {
              duration.value = 7;
            }}
          />
          <span class="text-sm">1 week</span>
        </label>
        <label className="flex cursor-pointer items-center gap-x-2">
          <input
            type="radio"
            name="duration"
            value="30"
            class="form-radio text-primary focus:ring-primary/50 cursor-pointer"
            checked={duration.value === 30}
            onInput={() => {
              duration.value = 30;
            }}
          />
          <span class="text-sm">1 month</span>
        </label>
      </div>
    </div>
  );
}

export interface PasswordFormProps {
  encryptionPublicKey: string;
  mode: UIMode;
  userId: string;
  // oxlint-disable-next-line typescript/no-explicit-any -- false positive
  onSuccess: (result: any) => void;
  onCancel: () => void;
}

export default function PasswordForm({
  mode,
  onSuccess,
  onCancel,
  encryptionPublicKey,
  userId,
}: PasswordFormProps) {
  const password = useSignal("");
  const duration = useSignal(7);
  const hasError = useSignal(false);
  const isLoading = useSignal(false);

  async function derivePublicKeyFromPassword(password: string) {
    const salt = userId;

    if (!salt) {
      throw new Error("Salt is invalid, please try again.");
    }

    const secretKey = await keyDerivation(password, salt);
    const keyPair = nacl.box.keyPair.fromSecretKey(secretKey);
    return encode(keyPair.publicKey);
  }

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

    onSuccess({
      encryptionPasswordStore: "user",
      password: password.value,
      duration: duration.value,
    });
  };

  const showPassword = useSignal(false);

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      {mode === "new" ? (
        <>
          <Heading>Create your idOS Password</Heading>

          <Paragraph>Create a password for encrypting and decrypting your idOS data.</Paragraph>

          <div class="flex flex-col gap-4">
            <label htmlFor="idos-password-input" class="text-foreground text-sm font-medium">
              New password
            </label>
            <PasswordField
              password={password}
              hasError={hasError}
              showPassword={showPassword}
              placeholder="Enter password"
            />
            <DurationField duration={duration} />
          </div>

          <div class="bg-muted rounded-xl p-4">
            <div class="flex gap-4">
              <span class="text-red-500">
                <CircleAlertIcon size={32} />
              </span>
              <p class="text-xs">
                Losing this password means losing access to your data. There is no backup, we
                recommend most users go back and sign with their wallets via MPC.
              </p>
            </div>
          </div>

          <div class="flex items-center justify-between gap-3">
            <Button type="button" variant="secondary" onClick={onCancel} class="flex-1">
              Back
            </Button>
            <Button type="submit" class="flex-1">
              Continue
            </Button>
          </div>
        </>
      ) : (
        <>
          <Heading>Unlock your idOS key</Heading>

          <Paragraph>Please enter your idOS password below:</Paragraph>

          <div class="flex flex-col gap-4">
            <label htmlFor="idos-password-input" class="text-foreground text-sm font-medium">
              Password
            </label>
            <PasswordField
              password={password}
              hasError={hasError}
              showPassword={showPassword}
              placeholder="Enter password"
            />
            <DurationField duration={duration} />
          </div>

          <p class="text-muted-foreground text-center text-sm">
            Make sure to store it securely — you’ll need it to view or share your data later.
          </p>

          <Button type="submit" disabled={isLoading.value}>
            {isLoading.value ? "Unlocking..." : "Unlock"}
          </Button>
        </>
      )}
    </form>
  );
}
