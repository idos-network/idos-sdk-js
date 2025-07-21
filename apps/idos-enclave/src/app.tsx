import type { Store } from "@idos-network/utils/store";
import { effect, useSignal } from "@preact/signals";
import type { PropsWithChildren } from "preact/compat";
import { useCallback, useRef } from "preact/hooks";

import { Header } from "@/components/header";
import Auth from "@/features/auth";
import PasswordOrKeyBackup from "@/features/backup";
import Confirmation from "@/features/confirmation";
import type { AllowedIntent, AuthMethod, idOSEnclaveConfiguration, Theme, UIMode } from "@/types";

export interface EventData {
  intent: AllowedIntent;
  // biome-ignore lint/suspicious/noExplicitAny: The message will be a bit hard to narrow. Using `any` is fine in this case.
  message: Record<string, any>;
  configuration: idOSEnclaveConfiguration;
}

const allowedIntents: AllowedIntent[] = ["confirm", "auth", "backupPasswordOrSecret"];

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
  const allowedAuthMethods = useSignal<AuthMethod[] | null>(null);
  const previouslyUsedAuthMethod = useSignal<AuthMethod | null>(null);
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

  const isBackupMode = useSignal(false);
  const backupAuthMethod = useSignal<AuthMethod | null>(null);
  const backupSecret = useSignal<string | null>(null);

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
          allowedAuthMethods.value = requestData.message?.allowedAuthMethods;
          previouslyUsedAuthMethod.value = requestData.message?.previouslyUsedAuthMethod;
          break;

        // TODO: Password intent is deprecated, remove it in the future.
        case "password":
          method.value = null;
          allowedAuthMethods.value = ["password"];
          previouslyUsedAuthMethod.value = "password";
          break;

        case "confirm":
          confirm.value = true;
          origin.value = requestData.message?.origin;
          message.value = requestData.message?.message;
          break;

        case "backupPasswordOrSecret":
          isBackupMode.value = true;
          backupAuthMethod.value = requestData.message?.authMethod;
          backupSecret.value = requestData.message?.secret;
          break;
      }

      if (requestData.configuration.mode) mode.value = requestData.configuration.mode;
      if (requestData.configuration.theme) theme.value = requestData.configuration.theme;
    },
    [
      enclave,
      isBackupMode,
      confirm,
      message,
      origin,
      theme,
      mode,
      encryptionPublicKey,
      method,
      allowedAuthMethods,
      previouslyUsedAuthMethod,
      backupAuthMethod,
      backupSecret,
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
    allowedAuthMethods: allowedAuthMethods.value ?? [],
    previouslyUsedAuthMethod: previouslyUsedAuthMethod.value,
    encryptionPublicKey: encryptionPublicKey.value,
    userId: userId.value,
  };

  if (confirm.value && message.value) {
    return (
      <Layout>
        <Confirmation message={message.value} origin={origin.value} onSuccess={onSuccess} />
      </Layout>
    );
  }

  if (isBackupMode.value && backupAuthMethod.value && backupSecret.value) {
    return (
      <Layout>
        <PasswordOrKeyBackup
          authMethod={backupAuthMethod.value}
          secret={backupSecret.value}
          onSuccess={onSuccess}
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <Auth {...methodProps} />
    </Layout>
  );
}
