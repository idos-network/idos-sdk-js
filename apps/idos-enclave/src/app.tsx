import type { Store } from "@idos-network/core";
import { useSignal } from "@preact/signals";
import type { PropsWithChildren } from "preact/compat";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";

import { Header } from "@/components/header";
import { PasswordForm } from "@/features/auth/password-form";
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
  const [method, setMethod] = useState<AuthMethod | null>(null);
  const [mode, setMode] = useState<UIMode>("existing");
  const [theme, setTheme] = useState<Theme | null>(localStorage.getItem("theme") as Theme | null);
  const [confirm, setConfirm] = useState<boolean>(false);
  const responsePort = useRef<MessagePort | null>(null);

  const [origin, setOrigin] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [encryptionPublicKey, setEncryptionUserPublicKey] = useState<string>("");
  const [userId] = useState<string | null>(
    new URLSearchParams(window.location.search).get("userId"),
  );

  const isRecoveryMode = useSignal(false);
  const isBackupMode = useSignal(false);
  const backupStatus = useSignal<"pending" | "success" | "failure">("pending");

  useEffect(() => {
    if (!theme) {
      setTheme(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    } else {
      localStorage.setItem("theme", theme);
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [theme]);

  useEffect(() => {
    if (mode === "new" || !responsePort.current) return;
    if (!encryptionPublicKey) onError("Can't find a public encryption key for this user");
  }, [mode, encryptionPublicKey]);

  const messageReceiver = useCallback(
    (event: MessageEvent<EventData>) => {
      if (event.source !== enclave) return;

      const { data: requestData, ports } = event;

      if (!allowedIntents.includes(requestData.intent))
        throw new Error(`Unexpected request from parent: ${requestData.intent}`);

      responsePort.current = ports[0];
      setEncryptionUserPublicKey(requestData.message?.expectedUserEncryptionPublicKey);

      switch (requestData.intent) {
        case "auth":
          setMethod(null);
          break;

        case "password":
          setMethod("password");
          break;

        case "confirm":
          setConfirm(true);
          setOrigin(requestData.message?.origin);
          setMessage(requestData.message?.message);
          break;

        case "backupPasswordOrSecret":
          isBackupMode.value = true;
          backupStatus.value = requestData.message?.status;
          break;
      }

      if (requestData.configuration.mode) setMode(requestData.configuration.mode);
      if (requestData.configuration.theme) setTheme(requestData.configuration.theme);
    },
    [backupStatus, enclave, isBackupMode],
  );

  const respondToEnclave = useCallback((data: unknown) => {
    if (responsePort.current) {
      responsePort.current.postMessage(data);
      window.removeEventListener("beforeunload", onBeforeUnload);
      responsePort.current.close();
    }
  }, []);

  const onBeforeUnload = useCallback(
    (event: BeforeUnloadEvent) => {
      event.preventDefault();
      respondToEnclave({ error: "closed" });
    },
    [respondToEnclave],
  );

  useEffect(() => {
    window.addEventListener("message", messageReceiver);
    window.addEventListener("beforeunload", onBeforeUnload);

    window.dispatchEvent(new Event("idOS-Enclave:ready"));

    return () => {
      window.removeEventListener("message", messageReceiver);
    };
  }, [messageReceiver, onBeforeUnload]);

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

  const methodProps = {
    store,
    onError,
    onSuccess,
    mode,
  };

  useEffect(() => {
    if (mode === "new" || !responsePort.current) return;
    if (!encryptionPublicKey) onError("can't find a public encryption key for this user");
  }, [mode, encryptionPublicKey, onError]);

  if (confirm && message) {
    return (
      <Layout>
        <Confirmation message={message} origin={origin} onSuccess={onSuccess} />
      </Layout>
    );
  }

  if (method === "password") {
    return (
      <Layout>
        <PasswordForm {...methodProps} encryptionPublicKey={encryptionPublicKey} userId={userId} />
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
      <PasswordForm {...methodProps} encryptionPublicKey={encryptionPublicKey} userId={userId} />
    </Layout>
  );
}
