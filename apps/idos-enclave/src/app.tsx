import type { EncryptionPasswordStore } from "@idos-network/utils/enclave";
import { effect, useSignal } from "@preact/signals";
import type { PropsWithChildren } from "preact/compat";
import { useCallback, useRef } from "preact/hooks";
import { Header } from "@/components/header";
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
  enclave: Window;
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

  // User ID is in search params, not like a message
  const userId = useSignal<string | null>(
    new URLSearchParams(window.location.search).get("userId"),
  );

  // Backup secret mode
  const isBackupMode = useSignal(false);
  const backupEncryptionPasswordStore = useSignal<EncryptionPasswordStore | null>(null);
  const backupPassword = useSignal<string | null>(null);

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

  const messageReceiver = useCallback(
    (event: MessageEvent<EventData>) => {
      if (event.source !== enclave) return;

      const { data: requestData, ports } = event;

      if (!allowedIntents.includes(requestData.intent)) {
        window.close();
        throw new Error(`Unexpected request from parent: ${requestData.intent}`);
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
    },
    [
      enclave,
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
    window.addEventListener("beforeunload", onBeforeUnload);

    window.dispatchEvent(new Event("idOS-Enclave:ready"));

    return () => {
      window.removeEventListener("message", messageReceiver);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  });

  if (confirm.value && message.value) {
    return (
      <Layout>
        <Confirmation message={message.value} origin={origin.value} onSuccess={onSuccess} />
      </Layout>
    );
  }

  if (isBackupMode.value && backupEncryptionPasswordStore.value && backupPassword.value) {
    return (
      <Layout>
        <BackupPasswordContext
          encryptionPasswordStore={backupEncryptionPasswordStore.value}
          password={backupPassword.value}
          onSuccess={onSuccess}
        />
      </Layout>
    );
  }

  return (
    <Layout>
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
