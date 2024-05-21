import type { Store } from "@idos-network/idos-store";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { Header } from "./Header";
import Confirmation from "./confirm/Confirmation";
import ChooseMethod from "./methods/Chooser";
import Passkey from "./methods/Passkey";
import Password from "./methods/Password";

export type Flow = "new" | "existing" | "confirm";
export type Method = "password" | "passkey";
export type Theme = "dark" | "light";

export interface AppProps {
  store: Store;
  enclave: Window;
}

export interface EventData {
  intent: "passkey" | "password" | "confirm" | "auth" | "create" | "theme";
  message: any;
}

export function App({ store, enclave }: AppProps) {
  const [method, setMethod] = useState<Method | null>(null);
  const [flow, setFlow] = useState<Flow>("existing");
  const [theme, setTheme] = useState<Theme | null>(localStorage.getItem("theme") as Theme | null);
  const responsePort = useRef<MessagePort | null>(null);

  // Passkey options
  const [passkeyType, setPasskeyType] = useState<"password" | "webauthn" | null>("webauthn");

  // Confirm options
  const [origin, setOrigin] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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

    if (!["passkey", "password", "confirm", "auth", "theme", "create"].includes(requestData.intent))
      throw new Error(`Unexpected request from parent: ${requestData.intent}`);

    responsePort.current = ports[0];

    switch (requestData.intent) {
      case "auth":
        setMethod(null);
        break;

      case "passkey":
        setMethod("passkey");
        if (requestData.message?.type) {
          setPasskeyType(requestData.message.type);
        }
        break;

      case "password":
        setMethod("password");
        break;

      case "create":
        setFlow("new");
        break;

      case "theme":
        setTheme((requestData.message as Theme) ?? "light");
        break;

      case "confirm":
        setFlow("confirm");
        setOrigin(requestData.message?.origin);
        setMessage(requestData.message?.message);
        break;
    }
  }, []);

  const respondToEnclave = useCallback(
    (data: any) => {
      if (responsePort.current) {
        responsePort.current.postMessage(data);
        window.removeEventListener("beforeunload", onBeforeUnload);
        responsePort.current.close();
      }
    },
    [responsePort],
  );

  const onBeforeUnload = useCallback((e: any) => {
    e.preventDefault();
    e.returnValue = "";
    respondToEnclave({ error: "closed " });
  }, []);

  useEffect(() => {
    window.addEventListener("message", messageReceiver);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.removeEventListener("message", messageReceiver);
    };
  }, []);

  const onSuccess = useCallback((result: any) => {
    respondToEnclave({ result });
  }, []);

  const onError = useCallback((error: any) => {
    respondToEnclave({ error: error.toSring() });
  }, []);

  const methodProps = {
    store,
    onError,
    onSuccess,
    flow,
  };

  return (
    <>
      {theme && (
        <Header
          goHome={goHome}
          toggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
          theme={theme}
        />
      )}
      <main className="flex-1 flex justify-center mt-6">
        <div className="w-[30rem] text-center">
          {flow !== "confirm" && (
            <>
              {!method && <ChooseMethod setMethod={setMethod} flow={flow} />}
              {method == "password" && <Password {...methodProps} />}
              {method === "passkey" && passkeyType && (
                <Passkey type={passkeyType} {...methodProps} />
              )}
            </>
          )}

          {flow === "confirm" && message && (
            <Confirmation message={message} origin={origin} onSuccess={onSuccess} />
          )}
        </div>
      </main>
    </>
  );
}
