import type { EncryptionPasswordStore } from "@idos-network/enclave";
import { effect, useSignal } from "@preact/signals";
import { XIcon } from "lucide-react";
import type { PropsWithChildren } from "preact/compat";
import { useCallback, useEffect, useRef } from "preact/hooks";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import Auth from "@/features/auth";
import BackupPasswordContext from "@/features/backup";
import Confirmation from "@/features/confirmation";
import type { AllowedIntent, idOSEnclaveConfiguration, Theme, UIMode } from "@/types";

export interface EventData {
  intent: AllowedIntent;
  // biome-ignore lint/suspicious/noExplicitAny: The message will be a bit hard to narrow. Using `any` is fine in this case.
  message: Record<string, any>;
  configuration: idOSEnclaveConfiguration;
}

const allowedIntents: AllowedIntent[] = ["confirm", "getPasswordContext", "backupPasswordContext"];

type LayoutProps = PropsWithChildren & {
  onClose: () => void;
};

function Layout({ children, onClose }: LayoutProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // Open the dialog modally if not already open
    if (!dialog.open && dialog.showModal) {
      dialog.showModal();
    }

    const handleCancel = (event: Event) => {
      // Prevent default closing so we can route through our onClose handler
      event.preventDefault();
      onClose();
    };

    dialog.addEventListener("cancel", handleCancel);
    dialog.addEventListener("close", handleCancel);

    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      dialog.removeEventListener("close", handleCancel);
      if (dialog.open) {
        dialog.close();
      }
    };
  }, [onClose]);

  return (
    <dialog ref={dialogRef} className="m-0 p-0 border-none bg-transparent">
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="relative flex flex-col gap-6 w-full max-w-[380px] bg-zinc-900 p-6 border border-zinc-700 rounded-xl shadow-2xl animate-slideIn">
          <button
            type="button"
            aria-label="Close idOS enclave"
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md p-1 size-8 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-muted-foreground focus:ring-offset-2 focus:ring-offset-background"
            onClick={onClose}
          >
            <XIcon className="size-5" />
          </button>
          <Header />
          <main>{children}</main>
        </div>
      </div>
    </dialog>
  );
}

type AppProps = {
  enclave: {
    parentOrigin: string;
  };
};

export function App({ enclave }: AppProps) {
  // App configuration
  const theme = useSignal<Theme | null>(localStorage.getItem("theme") as Theme | null);
  const responsePort = useRef<MessagePort | null>(null);

  // Password context configuration
  const mode = useSignal<UIMode>("existing");
  const allowedEncryptionStores = useSignal<EncryptionPasswordStore[] | null>(null);
  const encryptionPasswordStore = useSignal<EncryptionPasswordStore | null>(null);
  const expectedUserEncryptionPublicKey = useSignal<string | null>(null);

  // Confirmation
  const confirm = useSignal<boolean>(false);
  const origin = useSignal<string | null>(null);
  const message = useSignal<string | null>(null);

  // User ID comes from enclave configuration (message.configuration.userId)
  const userId = useSignal<string | null>(null);

  // Backup secret mode
  const isBackupMode = useSignal(false);
  const backupEncryptionPasswordStore = useSignal<EncryptionPasswordStore | null>(null);
  const backupPassword = useSignal<string | null>(null);

  // User activation state (replaces old unlock/confirm/backup buttons)
  const currentIntent = useSignal<AllowedIntent | null>(null);
  const hasUserActivated = useSignal(false);

  const respondToEnclave = useCallback((data: unknown) => {
    if (responsePort.current) {
      responsePort.current.postMessage(data);
      responsePort.current.close();
    }
  }, []);

  const onSuccess = useCallback(
    (result: unknown) => {
      respondToEnclave({ result });
    },
    [respondToEnclave],
  );

  const onCancel = useCallback(() => {
    respondToEnclave({ error: "closed" });
    // Always ask parent to hide the enclave iframe, even if there is no active request
    window.parent.postMessage({ type: "idOS:enclaveClose" }, enclave.parentOrigin);
  }, [respondToEnclave, enclave.parentOrigin]);

  const messageReceiver = useCallback(
    (event: MessageEvent<EventData>) => {
      // Accept messages from same window (internal Enclave class) or parent window (external client)
      const isInternalMessage = event.source === window && event.origin === window.origin;
      const isParentMessage =
        event.source === window.parent && event.origin === enclave.parentOrigin;

      if (!isInternalMessage && !isParentMessage) return;

      const { data: requestData, ports } = event;

      // Ignore messages that don't have the expected structure (e.g., from browser extensions)
      if (!requestData || typeof requestData !== "object" || !requestData.intent) {
        return;
      }

      if (!allowedIntents.includes(requestData.intent)) {
        console.warn(`Unexpected intent from enclave message: ${requestData.intent}`);
        return;
      }

      // Ensure we have a port to respond to
      if (!ports || ports.length === 0) {
        console.warn("Received enclave message without response port");
        return;
      }

      responsePort.current = ports[0];

      switch (requestData.intent) {
        case "getPasswordContext":
          allowedEncryptionStores.value = requestData.message?.allowedEncryptionStores;
          encryptionPasswordStore.value = requestData.message?.encryptionPasswordStore;
          expectedUserEncryptionPublicKey.value =
            requestData.message?.expectedUserEncryptionPublicKey;
          break;

        case "confirm":
          confirm.value = true;
          origin.value = requestData.message?.origin;
          message.value = requestData.message?.message;
          break;

        case "backupPasswordContext":
          isBackupMode.value = true;
          backupEncryptionPasswordStore.value = requestData.message?.encryptionPasswordStore;
          backupPassword.value = requestData.message?.password;
          break;
      }

      if (requestData.configuration.mode) mode.value = requestData.configuration.mode;
      if (requestData.configuration.theme) theme.value = requestData.configuration.theme;
      if (requestData.configuration.userId) userId.value = requestData.configuration.userId;

      // Track current intent and reset activation on each new request
      currentIntent.value = requestData.intent;
      hasUserActivated.value = false;
    },
    [
      enclave.parentOrigin,
      isBackupMode,
      confirm,
      message,
      origin,
      theme,
      mode,
      allowedEncryptionStores,
      encryptionPasswordStore,
      expectedUserEncryptionPublicKey,
      backupEncryptionPasswordStore,
      backupPassword,
    ],
  );

  effect(() => {
    window.addEventListener("message", messageReceiver);

    return () => {
      window.removeEventListener("message", messageReceiver);
    };
  });

  if (confirm.value && message.value) {
    // Step 1: require explicit user activation (like old "confirm" button)
    if (!hasUserActivated.value) {
      return (
        <Layout onClose={onCancel}>
          <div className="flex flex-col gap-4 items-center text-center">
            <p className="text-sm text-muted-foreground">
              {origin.value
                ? `A request from ${origin.value} needs your approval.`
                : "A request needs your approval."}
            </p>
            <Button
              type="button"
              className="w-full"
              onClick={() => {
                hasUserActivated.value = true;
              }}
            >
              See request
            </Button>
          </div>
        </Layout>
      );
    }

    return (
      <Layout onClose={onCancel}>
        <Confirmation message={message.value} origin={origin.value} onSuccess={onSuccess} />
      </Layout>
    );
  }

  if (isBackupMode.value && backupEncryptionPasswordStore.value && backupPassword.value) {
    // Step 1: explicit activation before showing backup UI
    if (!hasUserActivated.value) {
      return (
        <Layout onClose={onCancel}>
          <div className="flex flex-col gap-4 items-center text-center">
            <p className="text-sm text-muted-foreground">
              Back up your idOS key so you don&apos;t lose access to your data.
            </p>
            <Button
              type="button"
              className="w-full"
              onClick={() => {
                hasUserActivated.value = true;
              }}
            >
              Back up idOS key
            </Button>
          </div>
        </Layout>
      );
    }

    return (
      <Layout onClose={onCancel}>
        <BackupPasswordContext
          encryptionPasswordStore={backupEncryptionPasswordStore.value}
          password={backupPassword.value}
          onSuccess={onSuccess}
        />
      </Layout>
    );
  }

  // Default: getPasswordContext (unlock/create)
  if (!hasUserActivated.value) {
    const isNew = mode.value === "new";

    return (
      <Layout onClose={onCancel}>
        <div className="flex flex-col gap-4 items-center text-center">
          <p className="text-sm text-muted-foreground">
            {isNew ? "Create your idOS key to continue." : "Unlock your idOS key to continue."}
          </p>
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              hasUserActivated.value = true;
            }}
          >
            {isNew ? "Create idOS key" : "Unlock idOS"}
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout onClose={onCancel}>
      <Auth
        allowedEncryptionStores={allowedEncryptionStores.value ?? []}
        encryptionPasswordStore={encryptionPasswordStore.value}
        mode={mode.value}
        onSuccess={onSuccess}
        encryptionPublicKey={expectedUserEncryptionPublicKey.value ?? undefined}
        userId={userId.value}
      />
    </Layout>
  );
}
