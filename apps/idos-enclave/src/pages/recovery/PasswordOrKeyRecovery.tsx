import { useSignal } from "@preact/signals";

import { Button } from "../../components/ui/button";
import { Heading } from "../../components/ui/heading";
import { Paragraph } from "../../components/ui/paragraph";
import { TextField } from "../../components/ui/text-field";

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

export interface PasswordOrKeyRecoveryProps {
  onSuccess: ({ password }: { password: string }) => void;
}
export function PasswordOrKeyRecovery({ onSuccess }: PasswordOrKeyRecoveryProps) {
  const recoveryMode = useSignal<"google" | "lit">();

  if (recoveryMode.value === "google") {
    return <GoogleDriveRecoveryMethod onSuccess={onSuccess} />;
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
        onClick={() => {
          recoveryMode.value = "lit";
        }}
      >
        Recover using Lit Protocol
      </Button>
    </div>
  );
}
