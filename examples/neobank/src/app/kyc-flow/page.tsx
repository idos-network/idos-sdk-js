"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect } from "react";
import invariant from "tiny-invariant";
import { VisibilityIcon } from "@/components/icons";
import { KycProgressBar } from "@/components/kyc-progress-bar";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/app-store";
import { TransakProvider } from "../providers/transak";

const Disclaimer = () => (
  <div className="mt-6 flex items-center justify-center">
    <div className="mx-auto max-w-2xl space-y-12 text-center">
      <h1 className="font-medium text-black text-xl md:text-2xl">IdentityVerifier</h1>

      <div className="mx-auto w-full max-w-[415px] font-medium">
        <p className="mb-3">
          You're about to submit mock sensitive data to our mock identity verification provider,
          IdentityVerifier.
        </p>

        <div className="">
          <p>
            By confirming, you agree to the{" "}
            <Link href="#" className="underline transition-all duration-200 hover:no-underline">
              Users' Agreement
            </Link>
            , and confirm you've read the{" "}
            <Link href="#" className="underline transition-all duration-200 hover:no-underline">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link href="#" className="underline transition-all duration-200 hover:no-underline">
              Transparency Document
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  </div>
);

const KycIframe = () => {
  const {
    kycUrl,
    completeKyc,
    setError,
    selectedKyc,
    selectedOnRampProvider,
    findTransakToken: setTransakToken,
  } = useAppStore();
  console.log({ kycUrl, selectedKyc });

  const handleIframeMessage = useCallback(
    async (event: MessageEvent) => {
      invariant(process.env.NEXT_PUBLIC_KRAKEN_API_URL, "NEXT_PUBLIC_KRAKEN_API_URL is not set");

      const krakenUrl = process.env.NEXT_PUBLIC_KRAKEN_API_URL;
      const normalizedOrigin = event.origin.replace(/\/$/, "");
      const normalizedKrakenUrl = krakenUrl.replace(/\/$/, "");

      if (normalizedOrigin === normalizedKrakenUrl) {
        if (event.data.error) {
          console.error("Kraken error:", event.data.error);
          setError(`KYC failed: ${event.data.error}`);
        } else if (event.data.open) {
          console.log("Opening wallet connection:", event.data.open);
          window.open(event.data.open, event.data.target, event.data.features);
        } else {
          // ANY OTHER MESSAGE FROM KRAKEN = KYC COMPLETED!
          console.log("KYC completed successfully - any message from Kraken without error/open");
          console.log({ event: event.data });
          // transak token
          const oneTimeToken = event.data.oneTimeToken;
          if (oneTimeToken && selectedOnRampProvider === "transak") {
            console.log("Transak token:", oneTimeToken);
            setTransakToken(oneTimeToken);
          }

          await completeKyc();
        }
      } else {
        console.log(
          "Message ignored - not from Kraken. Origin:",
          event.origin,
          "Expected:",
          normalizedKrakenUrl,
        );
      }
    },
    [completeKyc, setError, selectedOnRampProvider, setTransakToken],
  );

  useEffect(() => {
    window.addEventListener("message", handleIframeMessage);
    return () => window.removeEventListener("message", handleIframeMessage);
  }, [handleIframeMessage]);

  if (!kycUrl) {
    return (
      <div className="flex items-center justify-center">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4 text-center">
        <h2 className="font-medium text-xl">Complete KYC Verification</h2>
        {/* @todo: remove once ready */}
        <p className="text-gray-600">
          Using Kraken with {selectedKyc === "persona" ? "Persona" : "Sumsub"} integration
        </p>
      </div>

      <iframe
        src={kycUrl}
        width="100%"
        height="800px"
        title="KYC Verification"
        className="rounded-lg border"
        sandbox="allow-popups allow-forms allow-scripts allow-same-origin"
        allow="camera; microphone; geolocation"
      />
    </div>
  );
};

const OnRampIframe = () => {
  const { onRampUrl } = useAppStore();

  if (!onRampUrl) {
    return null;
  }

  return (
    <div className="w-full">
      <iframe
        src={onRampUrl}
        width="100%"
        height="800px"
        title="KYC Verification"
        className="rounded-lg border"
        sandbox="allow-popups allow-forms allow-scripts allow-same-origin"
        allow="camera; microphone; geolocation"
      />
    </div>
  );
};

export default function KycFlow() {
  const {
    currentStep,
    selectedOnRampProvider,
    selectedKyc,
    startKyc,
    startProviderFlow,
    isLoading,
    loadingMessage,
    errorMessage,
  } = useAppStore();

  const handleContinue = async () => {
    await startKyc();
  };

  useEffect(() => {
    if (currentStep === "provider-flow" && selectedOnRampProvider) {
      startProviderFlow();
    }
  }, [currentStep, selectedOnRampProvider, startProviderFlow]);

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-[1220px] flex-1 rounded-[40px] bg-secondary p-11">
        <div className="mx-auto flex w-full flex-1 flex-col items-center justify-center">
          <Loader2 className="mb-4 animate-spin" size={48} />
          <p>{loadingMessage || "Loading KYC..."}</p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="mx-auto flex w-full max-w-[1220px] flex-1 rounded-[40px] bg-secondary p-11">
        <div className="mx-auto flex w-full flex-1 flex-col items-center justify-center">
          <div className="text-center text-red-600">
            <h2 className="mb-2 font-medium text-xl">Error</h2>
            <p>{errorMessage}</p>
            <Button onClick={() => window.location.reload()} className="mt-4 bg-red-600 text-white">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === "kyc-flow") {
    return (
      <div className="mx-auto flex w-full max-w-[1220px] flex-1 rounded-[40px] bg-secondary p-11">
        <div className="mx-auto flex w-full flex-1 flex-col">
          <KycIframe />
          <div className="mt-4 flex w-full justify-center">
            <KycProgressBar />
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === "provider-flow") {
    return (
      <div className="mx-auto flex w-full max-w-[1220px] flex-1 rounded-[40px] bg-secondary p-11">
        <div className="mx-auto flex w-full flex-1 flex-col items-center justify-center">
          <div className="text-center">
            <h2 className="mb-4 font-medium text-green-600 text-xl">
              KYC Verification Complete! ✅
            </h2>
            <p className="mb-4">Setting up your {selectedOnRampProvider} transaction...</p>
          </div>
          <OnRampIframe />
          {selectedOnRampProvider === "transak" && <TransakProvider />}
        </div>
      </div>
    );
  }

  if (currentStep === "complete") {
    return (
      <div className="mx-auto flex w-full max-w-[1220px] flex-1 rounded-[40px] bg-secondary p-11">
        <div className="mx-auto flex w-full flex-1 flex-col items-center justify-center">
          <div className="text-center">
            <h2 className="mb-4 font-medium text-green-600 text-xl">Ready for Transaction! 🎉</h2>
            <p>You can now proceed with your {selectedOnRampProvider} transaction.</p>
          </div>
          <div className="mt-auto flex w-full justify-center">
            <KycProgressBar />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1220px] flex-1 rounded-[40px] bg-secondary p-11">
      <div className="mx-auto flex w-full flex-1 flex-col items-center justify-center">
        <div className="flex h-[100px] w-[100px] items-center justify-center rounded-md bg-info">
          <VisibilityIcon />
        </div>
        <Disclaimer />
        <Button
          onClick={handleContinue}
          className="mt-12 min-h-12 rounded-full bg-black px-12 text-white"
        >
          Continue with {selectedOnRampProvider} + {selectedKyc}
        </Button>
        <div className="mt-auto flex w-full justify-center">
          <KycProgressBar />
        </div>
      </div>
    </div>
  );
}
