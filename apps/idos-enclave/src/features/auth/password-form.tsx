import { keyDerivation } from "@idos-network/utils/encryption";
import { type Signal, useSignal } from "@preact/signals";
import { encode } from "@stablelib/base64";
import { CircleAlertIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import nacl from "tweetnacl";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Paragraph } from "@/components/ui/paragraph";
import { TextField, type TextFieldProps } from "@/components/ui/text-field";
import type { UIMode } from "@/types";

interface PasswordFieldProps extends Omit<TextFieldProps, "value" | "onInput"> {
  hasError?: Signal<boolean>;
  password: Signal<string>;
}

function PasswordField({ hasError, password, ...props }: PasswordFieldProps) {
  return (
    <div class="flex flex-col gap-1">
      <TextField
        id="idos-password-input"
        type="password"
        required={true}
        value={password.value}
        onInput={(e) => {
          password.value = (e.target as HTMLInputElement).value;
          // Clear error as soon as the user starts typing again
          if (hasError) {
            hasError.value = false;
          }
        }}
        {...props}
      />
      {hasError?.value ? (
        <p class="text-sm text-left font-semibold text-red-500 h-4">Invalid password.</p>
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
      <p className="text-left font-medium text-sm">Remember for:</p>
      <div class="flex items-center gap-x-6">
        <label className="flex cursor-pointer items-center gap-x-2">
          <input
            type="radio"
            name="duration"
            value="7"
            class="form-radio cursor-pointer text-primary focus:ring-primary/50"
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
            class="form-radio cursor-pointer text-primary focus:ring-primary/50"
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
  // biome-ignore lint/suspicious/noExplicitAny: false positive
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

    console.log("[idOS Enclave] Deriving key", {
      userId: salt,
      passwordLength: password.length,
    });

    const secretKey = await keyDerivation(password, salt);
    const keyPair = nacl.box.keyPair.fromSecretKey(secretKey);
    const derived = encode(keyPair.publicKey);
    console.log("[idOS Enclave] Derived public key (base64)", derived);
    return derived;
  }

  const onSubmit = async (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    isLoading.value = true;

    try {
      if (encryptionPublicKey) {
        console.log("[idOS Enclave] Submitting password form", {
          mode,
          hasEncryptionPublicKey: !!encryptionPublicKey,
        });

        let derivedPK: string;
        try {
          derivedPK = await derivePublicKeyFromPassword(password.value);
        } catch (error) {
          console.error("[idOS Enclave] Error during key derivation", error);
          hasError.value = true;
          isLoading.value = false;
          return;
        }

        console.log("[idOS Enclave] Comparing keys", {
          derivedPK,
          encryptionPublicKey,
          match: derivedPK === encryptionPublicKey,
        });

        if (derivedPK !== encryptionPublicKey) {
          hasError.value = true;
          isLoading.value = false;
          return;
        }
      }

      hasError.value = false;
      onSuccess({
        encryptionPasswordStore: "user",
        password: password.value,
        duration: duration.value,
      });
    } catch (error) {
      console.error("[idOS Enclave] Unexpected error in password submit", error);
      hasError.value = true;
      // Only clear loading state on error; on success the dialog will close
      isLoading.value = false;
    }
  };

  const showPassword = useSignal(false);

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      {mode === "new" ? (
        <>
          <Heading>Create your idOS Password</Heading>

          <Paragraph>Create a password for encrypting and decrypting your idOS data.</Paragraph>

          <div class="flex flex-col gap-4">
            <label htmlFor="idos-password-input" class="font-medium text-foreground text-sm">
              New password
            </label>
            <div class="relative">
              <PasswordField
                id="idos-password-input"
                type={showPassword.value ? "text" : "password"}
                password={password}
                hasError={hasError}
                placeholder="Enter password"
              />
              <button
                type="button"
                class="absolute right-2 top-6 -translate-y-1/2 cursor-pointer bg-muted p-2"
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
            <DurationField duration={duration} />
          </div>

          <div class="rounded-xl bg-muted p-4">
            <div class="flex gap-4">
              <span class="text-red-500">
                <CircleAlertIcon size={32} />
              </span>
              <p class="text-xs">
                Losing this password means losing access to your data.There is no backup, we
                recommend most users go back and sign with their wallets via MPC.
              </p>
            </div>
          </div>

          <div class="flex items-center justify-between gap-3">
            <Button type="button" variant="secondary" onClick={onCancel} class="flex-1">
              Cancel
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
            <label htmlFor="idos-password-input" class="font-medium text-foreground text-sm">
              Password
            </label>
            <div class="relative">
              <PasswordField
                id="idos-password-input"
                type={showPassword.value ? "text" : "password"}
                password={password}
                hasError={hasError}
                placeholder="Enter password"
              />
              <button
                type="button"
                class="absolute right-2 top-6 -translate-y-1/2 cursor-pointer bg-muted p-2"
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
            <DurationField duration={duration} />
          </div>

          <p class="text-muted-foreground text-sm text-center">
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
