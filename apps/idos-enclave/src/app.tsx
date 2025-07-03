import type { Store } from "@idos-network/core";
import { effect, useSignal } from "@preact/signals";
import type { PropsWithChildren } from "preact/compat";
import { useCallback, useRef } from "preact/hooks";

import { Header } from "@/components/header";
import { PasswordForm } from "@/features/auth/password-form";
import AuthMethodChooser from "@/features/auth/auth-method-chooser";
import { Confirmation } from "@/features/confirmation/confirmation";
import { PasswordOrKeyBackup } from "@/features/recovery/backup";
import { PasswordOrKeyRecovery } from "@/features/recovery/recovery";
import type { AllowedIntent, AuthMethod, Theme, UIMode, idOSEnclaveConfiguration } from "@/types";

export interface EventData {
  intent: AllowedIntent;
  // biome-ignore lint/suspicious/noExplicitAny: The message will be a bit hard to narrow. Using `any` is fine in this case.
  message: Record<string, any>;
  configuration: idOSEnclaveConfiguration;
}

const allowedIntents: AllowedIntent[] = ["password", "confirm", "auth", "backupPasswordOrSecret"];

function Layout({ children }: PropsWithChildren) {
  return (
    <div>
      <Header />
      <main className="mt-6 flex flex-1 justify-center">
        <div className="w-[30rem] text-center">{children}</div>
      </main>
    </div>
  );
}

type AppProps = {
  store: Store;
  enclave: Window;
};

export function App({ store, enclave }: AppProps) {
  const method = useSignal<AuthMethod | null>(null);
  const mode = useSignal<UIMode>("existing");
  const theme = useSignal<Theme | null>(localStorage.getItem("theme") as Theme | null);
  const confirm = useSignal<boolean>(false);
  const responsePort = useRef<MessagePort | null>(null);

  const origin = useSignal<string | null>(null);
  const message = useSignal<string | null>(null);
  const encryptionPublicKey = useSignal<string>("");
  const userId = useSignal<string | null>(
    new URLSearchParams(window.location.search).get("userId"),
  );

  const isRecoveryMode = useSignal(false);
  const isBackupMode = useSignal(false);
  const backupStatus = useSignal<"pending" | "success" | "failure">("pending");

  effect(() => {
    if (!theme.value) {
      theme.value = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else {
      localStorage.setItem("theme", theme.value);
      if (theme.value === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  });

  effect(() => {
    if (mode.value === "new" || !responsePort.current) return;
    if (!encryptionPublicKey.value) {
      onError("Can't find a public encryption key for this user");
    }
  });

  const respondToEnclave = useCallback((data: unknown) => {
    if (responsePort.current) {
      responsePort.current.postMessage(data);
      window.removeEventListener("beforeunload", onBeforeUnload);
      responsePort.current.close();
    }
  }, []);

  const onSuccess = useCallback(
    (result: unknown) => {
      respondToEnclave({ result });
    },
    [respondToEnclave],
  );

  const onError = useCallback(
    (error: unknown) => {
      respondToEnclave({ error: (error as Error).toString() });
    },
    [respondToEnclave],
  );

  const onBeforeUnload = useCallback(
    (event: BeforeUnloadEvent) => {
      event.preventDefault();
      onError("closed");
    },
    [onError],
  );

  const messageReceiver = useCallback(
    (event: MessageEvent<EventData>) => {
      if (event.source !== enclave) return;

      const { data: requestData, ports } = event;

      if (!allowedIntents.includes(requestData.intent))
        throw new Error(`Unexpected request from parent: ${requestData.intent}`);

      responsePort.current = ports[0];
      encryptionPublicKey.value = requestData.message?.expectedUserEncryptionPublicKey;

      switch (requestData.intent) {
        case "auth":
          method.value = null;
          break;

        case "password":
          method.value = "password";
          break;

        case "confirm":
          confirm.value = true;
          origin.value = requestData.message?.origin;
          message.value = requestData.message?.message;
          break;

        case "backupPasswordOrSecret":
          isBackupMode.value = true;
          backupStatus.value = requestData.message?.status;
          break;
      }

      if (requestData.configuration.mode) mode.value = requestData.configuration.mode;
      if (requestData.configuration.theme) theme.value = requestData.configuration.theme;
    },
    [
      enclave,
      isBackupMode,
      backupStatus,
      confirm,
      message,
      origin,
      theme,
      mode,
      encryptionPublicKey,
      method,
    ],
  );

  effect(() => {
    window.addEventListener("message", messageReceiver);
    window.addEventListener("beforeunload", onBeforeUnload);

    window.dispatchEvent(new Event("idOS-Enclave:ready"));

    return () => {
      window.removeEventListener("message", messageReceiver);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  });

  const methodProps = {
    store,
    onError,
    onSuccess,
    mode: mode.value,
  };

  if (confirm.value && message.value) {
    return (
      <Layout>
        <Confirmation message={message.value} origin={origin.value} onSuccess={onSuccess} />
      </Layout>
    );
  }

  if (method.value === "password") {
    return (
      <Layout>
        <PasswordForm
          {...methodProps}
          encryptionPublicKey={encryptionPublicKey.value}
          userId={userId.value}
        />
      </Layout>
    );
  }

  if (isBackupMode.value) {
    return (
      <Layout>
        <PasswordOrKeyBackup
          store={store}
          onSuccess={onSuccess}
          backupStatus={backupStatus.value}
        />
      </Layout>
    );
  }

  if (isRecoveryMode.value) {
    return (
      <Layout>
        <PasswordOrKeyRecovery onSuccess={onSuccess} />
      </Layout>
    );
  }

  return (
    <Layout>
      <AuthMethodChooser
        {...methodProps}
        setMethod={method.value === null ? (m) => method.value = m : () => {}}
      />
    </Layout>
  );
}
