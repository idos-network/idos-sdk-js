import { EyeSlashIcon } from "@heroicons/react/20/solid";
import {
  ArrowDownCircleIcon,
  CheckIcon,
  ClipboardIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import type { Store } from "@idos-network/utils/store";
import { useSignal } from "@preact/signals";
import type { JSX } from "preact";
import { useEffect } from "preact/hooks";

import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Paragraph } from "@/components/ui/paragraph";

function ClipboardCopyButton(props: JSX.HTMLAttributes<HTMLButtonElement>) {
  const clicked = useSignal(false);

  const handleClick = (event: JSX.TargetedMouseEvent<HTMLButtonElement>) => {
    clicked.value = true;
    props.onClick?.(event);
    setTimeout(() => {
      clicked.value = false;
    }, 2000);
  };

  return (
    <button
      type="button"
      class="text-green-500 transition-colors hover:text-green-700"
      {...props}
      onClick={handleClick}
    >
      {clicked.value ? (
        <CheckIcon class="h-6 w-6 text-green-700" />
      ) : (
        <ClipboardIcon class="h-6 w-6" />
      )}
    </button>
  );
}

function RevealButton(props: JSX.HTMLAttributes<HTMLButtonElement>) {
  const clicked = useSignal(false);

  const handleClick = (event: JSX.TargetedMouseEvent<HTMLButtonElement>) => {
    clicked.value = !clicked.value;
    props.onClick?.(event);
  };

  return (
    <button
      type="button"
      class="text-green-500 transition-colors hover:text-green-700"
      {...props}
      onClick={handleClick}
    >
      {clicked.value ? (
        <EyeSlashIcon class="h-6 w-6 text-green-700" />
      ) : (
        <EyeIcon class="h-6 w-6" />
      )}
    </button>
  );
}

function DownloadButton(props: JSX.HTMLAttributes<HTMLButtonElement>) {
  const clicked = useSignal(false);

  const handleClick = (event: JSX.TargetedMouseEvent<HTMLButtonElement>) => {
    clicked.value = true;
    props.onClick?.(event);
    setTimeout(() => {
      clicked.value = false;
    }, 2000);
  };

  return (
    <button
      type="button"
      class="text-green-500 transition-colors hover:text-green-700"
      {...props}
      onClick={handleClick}
    >
      {clicked.value ? (
        <CheckIcon class="h-6 w-6 text-green-700" />
      ) : (
        <ArrowDownCircleIcon class="h-6 w-6" />
      )}
    </button>
  );
}

function ReadonlyInput(
  props: JSX.HTMLAttributes<HTMLInputElement> & { type?: string; value?: string },
) {
  return (
    <input
      readOnly
      class="flex-1 border-0 bg-transparent font-semibold outline-none ring-0 focus:outline-none focus:ring-0"
      {...props}
    />
  );
}

function ReadonlyField(props: JSX.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      class="flex items-center justify-between gap-5 rounded-md border-2 border-green-400 px-2 py-1"
      {...props}
    />
  );
}

interface PasswordOrSecretRevealProps {
  authMethod: "password" | "secret key";
  secret: string;
  onCancel?: () => void;
  onDone?: () => void;
}

export function PasswordOrSecretReveal({
  authMethod,
  secret,
  onCancel,
  onDone,
}: PasswordOrSecretRevealProps) {
  const revealSecret = useSignal(false);
  const revealButtonLabel = revealSecret.value ? "Hide" : "View";

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(secret);
    } catch (error) {
      console.error("Failed to copy to clipboard", error);
    }
  };

  const handleDownload = () => {
    const content = `idOS ${authMethod}: ${secret}\n`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "idOS_credentials.txt";

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div class="flex flex-col gap-4 text-left">
      <div class="flex flex-col gap-1">
        <Paragraph>Your {authMethod} is:</Paragraph>
        <ReadonlyField>
          <ReadonlyInput type={revealSecret.value ? "text" : "password"} value={secret} />
          <div className="flex items-center gap-2">
            <RevealButton
              aria-label={`${revealButtonLabel} ${authMethod}`}
              title={`${revealButtonLabel} ${authMethod}`}
              onClick={() => {
                revealSecret.value = !revealSecret.value;
              }}
            />
            <ClipboardCopyButton
              aria-label={`Copy ${authMethod}`}
              title={`Copy ${authMethod}`}
              onClick={handleCopyToClipboard}
            />
            <DownloadButton
              aria-label={`Download ${authMethod}`}
              title={`Download ${authMethod}`}
              onClick={handleDownload}
            />
          </div>
        </ReadonlyField>
      </div>
      {onCancel ? <Button onClick={onCancel}>Go back</Button> : null}
      {onDone ? <Button onClick={onDone}>Done</Button> : null}
    </div>
  );
}

export async function PasswordOrKeyBackup({
  store,
  backupStatus,
  onSuccess,
}: {
  store: Store;
  backupStatus: "done" | "pending" | "success" | "failure";
  onSuccess: (result: unknown) => void;
}) {
  const reveal = useSignal(false);
  const status = useSignal<"idle" | "pending">("idle");

  const authMethod = await store.get<"passkey" | "password">("preferred-auth-method");
  const password = await store.get<string>("password");
  const passwordOrSecretKey: "password" | "secret key" =
    authMethod === "password" ? "password" : "secret key";

  const secret = password;

  const toggleReveal = () => {
    reveal.value = !reveal.value;
  };

  useEffect(() => {
    if (["failure", "done", "success"].includes(backupStatus)) {
      status.value = "idle";
    }
  }, [backupStatus]);

  if (reveal.value && secret) {
    return (
      <PasswordOrSecretReveal
        {...{ secret, authMethod: passwordOrSecretKey }}
        onCancel={toggleReveal}
        onDone={() => {
          onSuccess({
            type: "idOS:store",
            status: "success",
          });
        }}
      />
    );
  }

  const resultMsgSrc: Record<string, string> = {
    failure: "An error occurred while updating your attributes. Please try again.",
    success: `Your ${passwordOrSecretKey} has been encrypted and safely stored in your idOS.`,
  };

  const resultMsg = resultMsgSrc?.[backupStatus] || "";

  return (
    <div class="flex flex-col gap-5">
      <Heading>Create a backup of your idOS password or secret key.</Heading>
      <Button onClick={toggleReveal}>Reveal your {passwordOrSecretKey}</Button>
      {resultMsg ? <Paragraph>{resultMsg}</Paragraph> : null}
    </div>
  );
}
