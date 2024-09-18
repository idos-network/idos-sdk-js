import type { Store } from "@idos-network/idos-store";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { Header } from "./Header";
import Confirmation from "./confirm/Confirmation";
import ChooseMethod from "./methods/Chooser";
import LitProtocol from "./methods/LitProtocol";
import Passkey from "./methods/Passkey";
import Password from "./methods/Password";

export type Mode = "new" | "existing" | "confirm";
export type Method = "password" | "passkey" | "lit";
export type Theme = "dark" | "light";

export interface AppProps {
  store: Store;
  enclave: Window;
}

export interface Configuration {
  mode?: "new" | "existing";
  theme?: "light" | "dark";
}

export interface EventData {
  intent: "passkey" | "password" | "confirm" | "auth";
  // biome-ignore lint/suspicious/noExplicitAny: The message will be a bit hard to narrow. Using `any` is fine in this case.
  message: Record<string, any>;
  configuration: Configuration;
}

export function App({ store, enclave }: AppProps) {
  const [method, setMethod] = useState<Method | null>(null);
  const [mode, setMode] = useState<Mode>("existing");
  const [theme, setTheme] = useState<Theme | null>(localStorage.getItem("theme") as Theme | null);
  const [confirm, setConfirm] = useState<boolean>(false);
  const responsePort = useRef<MessagePort | null>(null);

  // Confirm options.
  const [origin, setOrigin] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [encryptionPublicKey, setEncryptionUserPublicKey] = useState<string>("");
  const [humanId] = useState<string | null>(
    new URLSearchParams(window.location.search).get("humanId"),
  );

  /**
   * Theme chooser.
   */
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

  const goHome = useCallback(() => setMethod(null), []);

  /**
   * Window message receiver.
   */
  const messageReceiver = useCallback((event: MessageEvent<EventData>) => {
    if (event.source !== enclave) return;

    const { data: requestData, ports } = event;

    if (!["passkey", "password", "confirm", "auth", "lit"].includes(requestData.intent))
      throw new Error(`Unexpected request from parent: ${requestData.intent}`);

    responsePort.current = ports[0];

    switch (requestData.intent) {
      case "auth":
        setMethod(null);
        setEncryptionUserPublicKey(event.data.message.expectedUserEncryptionPublicKey);
        break;

      case "passkey":
        setMethod("passkey");
        break;

      case "password":
        setMethod("password");
        break;

      case "confirm":
        setConfirm(true);
        setOrigin(requestData.message?.origin);
        setMessage(requestData.message?.message);
        break;
    }

    if (requestData.configuration.mode) setMode(requestData.configuration.mode);
    if (requestData.configuration.theme) setTheme(requestData.configuration.theme);
  }, []);

  const respondToEnclave = useCallback(
    (data: unknown) => {
      if (responsePort.current) {
        responsePort.current.postMessage(data);
        window.removeEventListener("beforeunload", onBeforeUnload);
        responsePort.current.close();
      }
    },
    [responsePort],
  );

  const onBeforeUnload = useCallback((event: BeforeUnloadEvent) => {
    event.preventDefault();
    event.returnValue = "";
    respondToEnclave({ error: "closed" });
  }, []);

  useEffect(() => {
    window.addEventListener("message", messageReceiver);
    window.addEventListener("beforeunload", onBeforeUnload);

    window.dispatchEvent(new Event("ready"));

    return () => {
      window.removeEventListener("message", messageReceiver);
    };
  }, []);

  const onSuccess = useCallback((result: unknown) => {
    respondToEnclave({ result });
  }, []);

  const onError = useCallback((error: unknown) => {
    respondToEnclave({ error: (error as Error).toString() });
  }, []);

  const methodProps = {
    store,
    onError,
    onSuccess,
    mode,
  };

  return (
    <>
      <Header goHome={goHome} />
      <main className="mt-6 flex flex-1 justify-center">
        <div className="w-[30rem] text-center">
          {!confirm && (
            <>
              {!method && <ChooseMethod setMethod={setMethod} mode={mode} />}

              {method === "password" && (
                <Password
                  {...methodProps}
                  encryptionPublicKey={encryptionPublicKey}
                  humanId={humanId}
                />
              )}

              {method === "passkey" && <Passkey {...methodProps} />}
              {method === "lit" && <LitProtocol {...methodProps} />}

            </>
          )}

          {confirm && message && (
            <Confirmation message={message} origin={origin} onSuccess={onSuccess} />
          )}
        </div>
      </main>
    </>
  );
}
