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
  const noahUrl = MachineContext.useSelector((state) => state.context.noahUrl);
  const errorMessage = MachineContext.useSelector((state) => state.context.errorMessage);
  const hifiTosUrl = MachineContext.useSelector((state) => state.context.hifiTosUrl);
  const onRampAccount = MachineContext.useSelector((state) => state.context.onRampAccount);
  const moneriumAuthUrl = MachineContext.useSelector((state) => state.context.moneriumAuthUrl);
  const moneriumProfileIbans = MachineContext.useSelector(
    (state) => state.context.moneriumProfileIbans,
  );

  const transak = useRef<Transak | null>(null);

  console.log("-> state", state);

  // biome-ignore lint/suspicious/noExplicitAny: false positive
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

    // Noah callback from /callbacks/noah
    if (message.data.type === "noah-done") {
      send({ type: "revokeAccessGrant" });
    }

    if (message.data.type === "hifi-tos-done") {
      send({ type: "acceptHifiTos", signedAgreementId: message.data.signedAgreementId });
    }

    if (message.data.type === "monerium-callback") {
      console.log("-> monerium callback", message.data.code);
      send({ type: "accessTokenFromCode", code: message.data.code });
    }
  }, []);

  useEffect(() => {
    window.addEventListener("message", messageReceiver);
    return () => window.removeEventListener("message", messageReceiver);
  }, []);

  console.log("-> state", state);
  console.log("-> provider", provider);

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
        console.log(orderData);
        transak.current?.close();
        send({ type: "revokeAccessGrant" });
        transak.current = null;
      });
    }
  }, [sharableToken, state, provider, send]);

  const start = async (provider: "transak" | "noah" | "custom" | "hifi" | "monerium") => {
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
          onClick={() => start("noah")}
        >
          Noah
        </button>
        <button
          type="button"
          className="w-full cursor-pointer rounded-lg bg-sky-600 px-6 py-3 font-semibold text-lg text-white transition-colors hover:bg-sky-700"
          onClick={() => start("hifi")}
        >
          Hifi
        </button>
        <button
          type="button"
          className="w-full cursor-pointer rounded-lg bg-purple-600 px-6 py-3 font-semibold text-lg text-white transition-colors hover:bg-purple-700"
          onClick={() => start("monerium")}
        >
          Monerium
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

  if (state === "chooseKYCType") {
    body = (
      <div className="flex flex-col items-center gap-8 p-8">
        <h1 className="font-bold text-3xl text-gray-800">Choose your KYC provider</h1>
        <div className="flex max-w-2xl flex-row gap-4">
          <button
            type="button"
            className="w-full cursor-pointer rounded-lg bg-blue-600 px-6 py-3 font-semibold text-lg text-white transition-colors hover:bg-blue-700"
            onClick={() => send({ type: "startKYC", kycType: "sumsub" })}
          >
            Sumsub
          </button>
          <button
            type="button"
            className="w-full cursor-pointer rounded-lg bg-green-600 px-6 py-3 font-semibold text-lg text-white transition-colors hover:bg-green-700"
            onClick={() => send({ type: "startKYC", kycType: "persona" })}
          >
            Persona
          </button>
        </div>
      </div>
    );
  }

  const messages: Record<string, string> = {
    findCredential: "Finding credential...",
    requestAccessGrant: "Requesting access grant...",
    waitForCredential: "Waiting for finding credential next attempt...",
    waitForHifiKycStatus: "Waiting for KYC status next attempt...",
    verifyHifiTos: "Verifying and creating a KYC for you...",
    login: "Logging in...",
    error: "Error",
    requestKrakenDAG: "Requesting access grant for KYC provider...",
    createToken: "Create a sharable token for provider...",
  };

  if (messages[state as keyof typeof messages]) {
    body = (
      <div className="mb-4 w-full text-center">
        <p>{messages[state as keyof typeof messages]}</p>
        {errorMessage && <p className="text-red-500">{errorMessage}</p>}
      </div>
    );
  }

  // @ts-expect-error Missing substates?
  if (state.createSharableToken) {
    body = (
      <div className="mb-4 w-full text-center">
        {/* @ts-expect-error Missing substates? */}
        <p>{messages[state.createSharableToken as keyof typeof messages]}</p>
        {errorMessage && <p className="text-red-500">{errorMessage}</p>}
      </div>
    );
  }

  if (state === "dataOrTokenFetched" && noahUrl && provider === "noah") {
    body = (
      <div className="w-full">
        <iframe src={noahUrl} width="100%" height="800px" title="KYC" />
      </div>
    );
  }

  if (state === "hifiTosFetched" && hifiTosUrl && provider === "hifi") {
    body = (
      <div className="w-full">
        <iframe src={hifiTosUrl} width="100%" height="800px" title="KYC" />
      </div>
    );
  }

  // @ts-expect-error Missing substates?
  if (state.moneriumFlow && moneriumAuthUrl && state.moneriumFlow === "moneriumAuthUrlFetched") {
    body = (
      <div className="w-full">
        <iframe src={moneriumAuthUrl} width="100%" height="800px" title="KYC" />
      </div>
    );
  }

  if (state === "dataOrTokenFetched" && provider === "hifi") {
    body = (
      <div className="w-full text-center">
        <p>KYC completed, you can do a transaction now</p>
        <pre>{JSON.stringify(onRampAccount, null, 2)}</pre>
        <button
          type="button"
          onClick={() => send({ type: "revokeAccessGrant" })}
          className="mt-10 cursor-pointer rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Continue by revoking an access grant
        </button>
      </div>
    );
  }

  if (state === "dataOrTokenFetched" && provider === "monerium" && moneriumProfileIbans) {
    body = (
      <div className="w-full text-center">
        <p>KYC completed, you now can send a money to one of your IBANs</p>
        <table className="mt-5 w-full border-1 border-gray-300">
          <thead>
            <tr>
              <th className="border-1 border-gray-300">IBAN</th>
              <th className="border-1 border-gray-300">BIC</th>
              <th className="border-1 border-gray-300">Chain</th>
              <th className="border-1 border-gray-300">State</th>
              <th className="border-1 border-gray-300">Email Notifications</th>
            </tr>
          </thead>
          <tbody>
            {moneriumProfileIbans.map((iban) => (
              <tr key={iban.iban}>
                <td>{iban.iban}</td>
                <td>{iban.bic}</td>
                <td>{iban.chain}</td>
                <td>{iban.state}</td>
                <td>{iban.emailNotifications ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          type="button"
          onClick={() => send({ type: "revokeAccessGrant" })}
          className="mt-10 cursor-pointer rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Continue by revoking an access grant
        </button>
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

        <div id="idOS-enclave" className={provider ? "m-auto block w-fit" : "hidden"} />
      </div>
    </div>
  );
}
