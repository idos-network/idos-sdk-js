import type { EncryptionPasswordStore } from "@idos-network/enclave";
import type { PropsWithChildren } from "preact/compat";

import { effect, useSignal } from "@preact/signals";
import { LoaderCircleIcon, XIcon } from "lucide-preact";
import { useCallback, useEffect, useRef } from "preact/hooks";

import type { Enclave } from "@/lib/enclave";
import type { AllowedIntent, Theme, UIMode } from "@/types";

import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import Auth from "@/features/auth";
import BackupPasswordContext from "@/features/backup";
import Confirmation from "@/features/confirmation";

type LayoutProps = PropsWithChildren & {
  onClose: () => void;
  showClose?: boolean;
};

function Layout({ children, onClose, showClose = true }: LayoutProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!dialog.open && dialog.showModal) {
      dialog.showModal();
    }

    const handleCancel = (event: Event) => {
      event.preventDefault();
      onClose();
    };

    dialog.addEventListener("cancel", handleCancel);

    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      if (dialog.open) {
        dialog.close();
      }
    };
  }, [onClose]);

  return (
    <dialog ref={dialogRef} className="m-0 border-none bg-transparent p-0">
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="animate-slideIn border-border bg-background relative flex w-full max-w-[380px] flex-col gap-6 rounded-xl border p-6 shadow-2xl">
          {showClose && (
            <button
              type="button"
              aria-label="Close idOS enclave"
              className="text-muted-foreground hover:bg-muted hover:text-foreground focus:ring-muted-foreground focus:ring-offset-background absolute top-4 right-4 flex size-8 items-center justify-center rounded-md p-1 focus:ring-2 focus:ring-offset-2 focus:outline-none"
              onClick={onClose}
            >
              <XIcon className="size-5" />
            </button>
          )}
          <Header />
          <main>{children}</main>
        </div>
      </div>
    </dialog>
  );
}

type AppProps = {
  enclave: Enclave;
};

export function App({ enclave }: AppProps) {
  const theme = useSignal<Theme | null>(localStorage.getItem("theme") as Theme | null);

  const activeIntent = useSignal<AllowedIntent | null>(null);
  const hasUserActivated = useSignal(false);

  // Password context
  const mode = useSignal<UIMode>("existing");
  const allowedEncryptionStores = useSignal<EncryptionPasswordStore[] | null>(null);
  const encryptionPasswordStore = useSignal<EncryptionPasswordStore | null>(null);
  const expectedUserEncryptionPublicKey = useSignal<string | null>(null);

  // Confirmation
  const confirmOrigin = useSignal<string | null>(null);
  const confirmMessage = useSignal<string | null>(null);

  // Backup
  const backupEncryptionPasswordStore = useSignal<EncryptionPasswordStore | null>(null);
  const backupPassword = useSignal<string | null>(null);

  const intentResolver = useRef<{
    resolve: (result: unknown) => void;
    reject: (error: unknown) => void;
  } | null>(null);

  const onSuccess = useCallback(
    (result: unknown) => {
      intentResolver.current?.resolve(result);
      intentResolver.current = null;
      activeIntent.value = null;
      hasUserActivated.value = false;
    },
    [activeIntent, hasUserActivated],
  );

  const onCancel = useCallback(() => {
    intentResolver.current?.reject(new Error("closed"));
    intentResolver.current = null;
    activeIntent.value = null;
    hasUserActivated.value = false;

    window.parent.postMessage({ type: "idOS:enclaveClose" }, enclave.parentOrigin);
  }, [activeIntent, hasUserActivated, enclave.parentOrigin]);

  effect(() => {
    enclave.setIntentHandler((intent, message, configuration) => {
      return new Promise((resolve, reject) => {
        intentResolver.current = { resolve, reject };

        switch (intent) {
          case "getPasswordContext":
            allowedEncryptionStores.value = message?.allowedEncryptionStores;
            encryptionPasswordStore.value = message?.encryptionPasswordStore;
            expectedUserEncryptionPublicKey.value = message?.expectedUserEncryptionPublicKey;
            break;

          case "confirm":
            confirmOrigin.value = message?.origin;
            confirmMessage.value = message?.message;
            break;

          case "backupPasswordContext":
            backupEncryptionPasswordStore.value = message?.encryptionPasswordStore;
            backupPassword.value = message?.password;
            break;
        }

        if (configuration.mode) mode.value = configuration.mode;
        if (configuration.theme) theme.value = configuration.theme;

        hasUserActivated.value = false;
        activeIntent.value = intent;
      });
    });
  });

  if (!activeIntent.value) return null;

  if (activeIntent.value === "pending") {
    return (
      <Layout onClose={() => {}} showClose={false}>
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <LoaderCircleIcon className="text-primary size-8 animate-spin" />
          <p className="text-muted-foreground text-sm">Processing...</p>
        </div>
      </Layout>
    );
  }

  // Confirmation intent
  if (activeIntent.value === "confirm" && confirmMessage.value) {
    if (!hasUserActivated.value) {
      return (
        <Layout onClose={onCancel}>
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-muted-foreground text-sm">
              {confirmOrigin.value
                ? `A request from ${confirmOrigin.value} needs your approval.`
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
        <Confirmation
          message={confirmMessage.value}
          origin={confirmOrigin.value}
          onSuccess={onSuccess}
        />
      </Layout>
    );
  }

  // Backup intent
  if (
    activeIntent.value === "backupPasswordContext" &&
    backupEncryptionPasswordStore.value &&
    backupPassword.value
  ) {
    if (!hasUserActivated.value) {
      return (
        <Layout onClose={onCancel}>
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-muted-foreground text-sm">
              Back up your idOS key so you don't lose access to your data.
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

  // getPasswordContext intent (unlock/create)
  if (!hasUserActivated.value) {
    const isNew = mode.value === "new";

    return (
      <Layout onClose={onCancel}>
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-muted-foreground text-sm">
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
        userId={enclave.userId ?? null}
      />
    </Layout>
  );
}
