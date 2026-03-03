import type { FaceSignSignerProvider } from "@idos-network/kwil-infra/facesign";
import { hexEncode } from "@idos-network/utils/codecs";
import { useRef, useState } from "react";
import { useWalletState } from "../state";
import { Button } from "./ui/button";

const ADD_WALLET_MESSAGE = "Sign this message to add FaceSign to your idOS profile";

const PRIVACY_POLICY_URL = "https://www.idos.network/legal/privacy-policy";
const TRANSPARENCY_DOCUMENT_URL =
  "https://drive.google.com/file/d/1lzrdgD_dwusE4xsKw_oTUcu8Hq3YU60b/view?usp=sharing";

type Step = "button" | "consent" | "running";

async function createProvider() {
  const { FaceSignSignerProvider } = await import("@idos-network/kwil-infra/facesign");

  const enclaveUrl = import.meta.env.VITE_FACESIGN_ENCLAVE_URL;
  if (!enclaveUrl) {
    throw new Error("VITE_FACESIGN_ENCLAVE_URL is not set");
  }

  return new FaceSignSignerProvider({
    metadata: {
      name: "idOS Embedded Wallet",
      description: "Add FaceSign to your idOS profile",
    },
    enclaveUrl,
  });
}

export function FaceSignConnector() {
  const [step, setStep] = useState<Step>("button");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const providerRef = useRef<FaceSignSignerProvider | null>(null);
  const { setWalletPayload, setConnectedWalletType } = useWalletState();

  const handleClick = async () => {
    setIsLoading(true);
    setError(null);
    setConnectedWalletType("FaceSign");

    try {
      const provider = await createProvider();
      providerRef.current = provider;

      const { hasKey } = await provider.preload();

      if (hasKey) {
        await runFlow(provider);
      } else {
        setStep("consent");
      }
    } catch (err) {
      console.error("FaceSign preload failed:", err);
      providerRef.current?.destroy();
      providerRef.current = null;
      setConnectedWalletType(null);
      setError(err instanceof Error ? err.message : "Failed to start FaceSign");
      setStep("button");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConsent = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let provider = providerRef.current;
      if (!provider) {
        provider = await createProvider();
        providerRef.current = provider;
      }

      await runFlow(provider);
    } catch (err) {
      console.error("FaceSign flow failed:", err);
      providerRef.current?.destroy();
      providerRef.current = null;
      setConnectedWalletType(null);
      setError(err instanceof Error ? err.message : "Failed to add FaceSign");
      setStep("button");
    } finally {
      setIsLoading(false);
    }
  };

  const runFlow = async (provider: FaceSignSignerProvider) => {
    setStep("running");

    const publicKey = await provider.init();
    const signatureBytes = await provider.signMessage(ADD_WALLET_MESSAGE);
    const signature = hexEncode(signatureBytes, true);

    setWalletPayload({
      address: publicKey,
      signature,
      public_key: [publicKey],
      message: ADD_WALLET_MESSAGE,
      disconnect: async () => {
        provider.destroy();
      },
    });
  };

  if (step === "consent") {
    return (
      <div className="flex max-w-sm flex-col gap-4 px-4">
        <h2 className="text-center font-bold text-lg">Biometric Consent</h2>
        <div className="max-h-[320px] overflow-y-auto text-neutral-400 text-xs leading-relaxed">
          <p>
            By proceeding, you explicitly consent to idOS Association processing your biometric
            data, including facial images and biometric data derived from them, for the purposes of
            enabling secure authentication and login to idOS through facial recognition; preventing
            fraud, misuse, and unauthorized access; and conducting manual reviews where automated
            verification is inconclusive or required for security, compliance, or user support
            purposes. Your consent includes, in particular, explicit consent to all downstream data
            processing by all companies named in the Privacy Policy, as well as their sub-processors
            and controllers who receive personal data or onward transfers from these companies or
            idOS Association within a data processing chain. You understand that: your biometric
            data constitutes special category personal data under applicable data protection laws;
            idOS Association acts as the data controller for this processing; your biometric data
            will be securely stored in a protected enclave; your facial data may be re-scanned and
            re-processed each time you choose to authenticate or access idOS services, including for
            future logins and manual verification processes. You acknowledge that this consent is
            freely given, specific, informed, and explicit, and that you may withdraw your consent
            at any time, with effect for the future, as described in the{" "}
            <a
              className="text-neutral-200 underline underline-offset-2"
              href={PRIVACY_POLICY_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </a>{" "}
            and the{" "}
            <a
              className="text-neutral-200 underline underline-offset-2"
              href={TRANSPARENCY_DOCUMENT_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Transparency Document
            </a>
            .
          </p>
          <p className="mt-3 text-neutral-300">
            Withdrawal of consent may limit or prevent your ability to use biometric authentication
            or access certain idOS features.
          </p>
        </div>
        <div className="mt-2 flex flex-col gap-4">
          <Button onClick={handleConsent} disabled={isLoading}>
            {isLoading ? "Loading..." : "Agree and Continue"}
          </Button>
          <Button
            onClick={() => {
              providerRef.current?.destroy();
              providerRef.current = null;
              setConnectedWalletType(null);
              setStep("button");
            }}
          >
            Back
          </Button>
        </div>
      </div>
    );
  }

  if (step === "running") {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-center text-neutral-400 text-sm">
          Complete the FaceSign flow in the enclave...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={handleClick} disabled={isLoading}>
        {isLoading ? "Loading..." : "Continue with FaceSign"}
        {!isLoading && (
          <img
            alt="FaceSign"
            src="/facesign-connect.svg"
            width={18}
            height={18}
            className="ml-auto"
          />
        )}
      </Button>
      {error && <p className="text-center text-red-400 text-xs">{error}</p>}
    </div>
  );
}
