import { useCallback, useEffect } from "react";

const url =
  "https://kraken.staging.sandbox.fractal.id/kyc?clientId=55dbf89f-63bc-41ba-a682-0db2aeb4ccf9&level=basic%2Bliveness";

type KYCJourneyProps = {
  onSuccess: (data: { token: string }) => void;
  onError: (error: unknown) => void;
};
export function KYCJourney({ onSuccess, onError }: KYCJourneyProps) {
  const messageReceiver = useCallback(
    (message: MessageEvent) => {
      // React only messages from ID iframe
      if (message.origin === "https://kraken.staging.sandbox.fractal.id") {
        if (message.data.error) {
          onError(message.data.error);
        } else if (message.data.open) {
          // If you want to use wallets, this is required
          // since there are security limitations, especially with
          // opening metamask protocol link in mobile device
          window.open(message.data.open, message.data.target, message.data.features);
        } else {
          onSuccess(message.data);
        }
      }
    },
    [onSuccess, onError],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: We don't need to react to the `messageReceiver`
  useEffect(() => {
    const controller = new AbortController();
    window.addEventListener("message", messageReceiver, { signal: controller.signal });

    return () => controller.abort();
  }, []);

  return (
    <div className="fixed inset-0 top-0 left-0 z-[10000] flex h-full w-full flex-col place-content-center items-center bg-black/30 backdrop-blur-sm transition-[opacity,visibility] duration-150 ease-in">
      <iframe
        id="kyc-journey"
        className="absolute h-[800px] w-[800px]"
        title="Kraken KYC"
        allow="camera *"
        sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
        src={url}
      />
    </div>
  );
}
