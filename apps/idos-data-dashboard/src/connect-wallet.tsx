import { useState } from "react";

import Arbitrum from "@/assets/arbitrum.webp";
import Ethereum from "@/assets/ethereum.webp";
import WalletConnect from "@/assets/wallet-connect.webp";
import { Button } from "@/components/ui/button";
import { useActorRef } from "@/machines/provider";

import { FacesignDialog } from "./components/facesign/facesign-dialog";
import { COMMON_ENV } from "./core/envFlags.common";
import { createFaceSignProvider } from "./lib/facesign";

export function ConnectWallet() {
  const { send } = useActorRef();
  const [facesignOpen, setFacesignOpen] = useState(false);
  const [facesignLoading, setFacesignLoading] = useState(false);

  const handleFacesignClick = async () => {
    setFacesignLoading(true);

    try {
      const provider = await createFaceSignProvider();

      const { hasKey } = await provider.preload();
      provider.destroy();

      if (hasKey) {
        send({ type: "CONNECT_FACESIGN" });
      } else {
        setFacesignOpen(true);
      }
    } catch (error) {
      console.error("FaceSign preload failed:", error);
    } finally {
      setFacesignLoading(false);
    }
  };

  const handleFacesignContinue = () => {
    setFacesignOpen(false);
    send({ type: "CONNECT_FACESIGN" });
  };

  const hasFacesign = !!COMMON_ENV.FACESIGN_ENCLAVE_URL;

  return (
    <div
      className="h-screen"
      style={{
        backgroundImage: "url('/cubes.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "repeat",
      }}
    >
      <div className="bg-card fixed inset-y-0 right-0 flex h-full w-full flex-col items-stretch overflow-y-auto p-5 md:items-center lg:w-[728px]">
        <div className="flex flex-1 flex-col place-content-center items-stretch gap-8 md:items-center">
          <img
            src="/logo-light.svg"
            alt="idOS Dashboard logo"
            className="mx-auto h-auto dark:hidden"
            width={208}
            height={62}
            loading="eager"
          />
          <img
            src="/logo.svg"
            alt="idOS Dashboard logo"
            className="mx-auto hidden h-auto dark:block"
            width={208}
            height={62}
            loading="eager"
          />

          <h1 className="text-center text-xl font-normal">
            Manage your data and grants effortlessly with the idOS Dashboard.
          </h1>

          <p className="text-center font-normal">Connect your wallet to get started.</p>

          <div className="mx-auto flex w-full max-w-[400px] min-w-0 flex-col items-stretch gap-3">
            {hasFacesign && (
              <>
                <Button
                  className="justify-between"
                  size="xl"
                  variant="secondary"
                  isLoading={facesignLoading}
                  onClick={handleFacesignClick}
                >
                  Continue with idOS FaceSign
                  <img alt="FaceSign" src="/facesign-connect.svg" width={28} height={28} />
                </Button>
                <FacesignDialog
                  open={facesignOpen}
                  onOpenChange={setFacesignOpen}
                  onContinue={handleFacesignContinue}
                />
              </>
            )}
            <Button
              className="justify-between"
              size="xl"
              variant="secondary"
              onClick={() => send({ type: "CONNECT_EVM" })}
            >
              Connect an EVM wallet
              <div className="flex items-center">
                <img
                  src={Arbitrum}
                  alt="Arbitrum"
                  className="h-9 w-full rounded-full border-2 border-[#1a1a1a] object-cover group-hover:border-neutral-800"
                />
                <img
                  src={Ethereum}
                  alt="Ethereum"
                  className="-ml-2 h-9 w-full rounded-full border-2 border-[#1a1a1a] object-cover group-hover:border-neutral-800"
                />
                <img
                  alt="Wallet connect"
                  src={WalletConnect}
                  className="-ml-2 h-9 w-full rounded-full border-2 border-[#1a1a1a] object-cover group-hover:border-neutral-800"
                />
              </div>
            </Button>
            <Button
              className="justify-between"
              size="xl"
              variant="secondary"
              onClick={() => send({ type: "CONNECT_STELLAR" })}
            >
              Connect with Stellar
              <img alt="Stellar logo" src="/stellar.svg" width={32} height={32} />
            </Button>
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-4 text-center">
          <span className="text-sm font-semibold">
            By connecting your wallet you agree to the{" "}
            <a
              className="text-primary inline-flex items-center gap-2 text-sm hover:underline hover:underline-offset-4"
              href="https://www.idos.network/legal/user-agreement"
              target="_blank"
              rel="noopener noreferrer"
            >
              User Agreement
            </a>{" "}
            and confirm you read our{" "}
            <a
              className="text-primary inline-flex items-center gap-2 text-sm hover:underline hover:underline-offset-4"
              href="https://www.idos.network/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </a>{" "}
            and{" "}
            <a
              className="text-primary inline-flex items-center gap-2 text-sm hover:underline hover:underline-offset-4"
              href="https://drive.google.com/file/d/1lzrdgD_dwusE4xsKw_oTUcu8Hq3YU60b/view?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
            >
              Transparency Document
            </a>
          </span>
          <span className="flex place-content-center items-center gap-2 text-sm font-semibold">
            <span className="text-sm font-semibold">Powered by</span>
            <img
              src="/logo-light.svg"
              alt="idOS logo"
              width={68}
              height={22}
              className="dark:hidden"
            />
            <img
              src="/logo.svg"
              alt="idOS logo"
              width={68}
              height={22}
              className="hidden dark:block"
            />
          </span>
        </div>
      </div>
    </div>
  );
}
