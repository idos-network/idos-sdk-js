import { Transak } from "@transak/transak-sdk";
import { useCallback, useEffect, useRef } from "react";
import { useUser } from "~/layouts/app";
import { COMMON_ENV } from "~/providers/envFlags.common";
import { useSiwe } from "~/providers/siwe-provider";
import { MachineContext } from "~/providers/state";

export default function App() {
  const { address } = useUser();
  const { signOut } = useSiwe();

  const { send } = MachineContext.useActorRef();

  const state = MachineContext.useSelector((state) => state.value);
  const provider = MachineContext.useSelector((state) => state.context.provider);
  const kycUrl = MachineContext.useSelector((state) => state.context.kycUrl);
  const sharableToken = MachineContext.useSelector((state) => state.context.sharableToken);
  const userData = MachineContext.useSelector((state) => state.context.data);
  const errorMessage = MachineContext.useSelector((state) => state.context.errorMessage);

  const transak = useRef<Transak | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: This is on purpose
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const messageReceiver = useCallback((message: any) => {
    // React only messages from ID iframe
    if (message.origin.replace(/\/$/, "") === COMMON_ENV.KRAKEN_API_URL.replace(/\/$/, "")) {
      if (message.data.error) {
        // Hide iframe ...
        console.error(message.data.error);
      } else if (message.data.open) {
        // If you want to use wallet-sign-in, this is required
        // since there are security limitations, especially with
        // opening metamask protocol link in mobile device
        window.open(message.data.open, message.data.target, message.data.features);
      } else {
        send({ type: "kycCompleted" });
      }
    }
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    window.addEventListener("message", messageReceiver);
    return () => window.removeEventListener("message", messageReceiver);
  }, []);

  useEffect(() => {
    if (!provider || state !== "accessGranted") return;

    if (provider === "transak") {
      send({ type: "getSharableToken" });
    }

    if (provider === "banxa") {
      send({ type: "fetchUserData" });
    }
  }, [state, provider, send]);

  useEffect(() => {
    if (state !== "dataOrTokenFetched" || !provider) return;

    if (provider === "transak" && !transak.current && sharableToken) {
      transak.current = new Transak({
        apiKey: "479983ae-3b37-4ac0-84f2-f42873b1a638", // (Required)
        // @ts-ignore - Transak SDK is not typed correctly
        environment: "STAGING", // (Required),
        kycShareTokenProvider: "SUMSUB",
        kycShareToken: sharableToken,
      });

      transak.current.init();

      Transak.on(Transak.EVENTS.TRANSAK_WIDGET_CLOSE, (orderData) => {
        console.log("-> Transak closed");
        console.log(orderData);
        transak.current?.close();
        send({ type: "revokeAccessGrant" });
        transak.current = null;
      });
    }

    if (provider === "banxa" && userData) {
      console.log("-> Banxa data", userData);
    }
  }, [sharableToken, state, provider, send, userData]);

  const start = async (provider: "transak" | "banxa" | "custom") => {
    send({ type: "configure", provider, address });
  };

  let body = <div>Loading...</div>;

  if (state === "notConfigured") {
    body = (
      <div className="m-auto flex w-full max-w-md flex-col gap-4">
        <button
          type="button"
          className="w-full cursor-pointer rounded-lg bg-blue-600 px-6 py-3 font-semibold text-lg text-white transition-colors hover:bg-blue-700"
          onClick={() => start("transak")}
        >
          Transak
        </button>
        <button
          type="button"
          className="w-full cursor-pointer rounded-lg bg-green-600 px-6 py-3 font-semibold text-lg text-white transition-colors hover:bg-green-700"
          onClick={() => start("banxa")}
        >
          Banxa
        </button>
        <button
          type="button"
          className="w-full cursor-pointer rounded-lg bg-purple-600 px-6 py-3 font-semibold text-lg text-white transition-colors hover:bg-purple-700"
          onClick={() => console.log("Custom selected")}
        >
          Custom
        </button>
      </div>
    );
  }

  if (state === "waitForKYC" && kycUrl) {
    body = (
      <div className="w-full">
        <iframe
          src={kycUrl}
          width="100%"
          height="800px"
          title="KYC"
          sandbox="allow-popups allow-forms allow-scripts allow-same-origin"
          allow="camera; microphone; geolocation; clipboard-write"
        />
      </div>
    );
  }

  const messages: Record<string, string> = {
    findCredential: "Finding credential...",
    requestAccessGrant: "Requesting access grant...",
    waitForCredential: "Waiting for finding credential next attempt...",
    login: "Logging in...",
    error: "Error",
  };

  if (messages[state as keyof typeof messages]) {
    body = (
      <div className="mb-4 w-full text-center">
        <p>{messages[state as keyof typeof messages]}</p>
        {errorMessage && <p className="text-red-500">{errorMessage}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 p-8">
      <h1 className="font-bold text-3xl text-gray-800">Choose your provider</h1>
      <div className="flex items-center gap-4">
        <p className="text-gray-600 dark:text-gray-300">You are logged in as {address}</p>
        <button
          type="button"
          onClick={signOut}
          className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-red-700"
        >
          Logout
        </button>
      </div>
      <div className="w-full">
        {body}
        {/* biome-ignore lint/nursery/useSortedClasses: <explanation> */}
        <div id="idOS-enclave" className={provider ? "block w-fit m-auto" : "hidden"} />
      </div>
    </div>
  );
}
