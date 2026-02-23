import { useState } from "react";
import { Button } from "@/components/ui/button";
import { dashboardActor } from "@/machines/dashboard.actor";
import { FacesignDialog } from "./components/facesign/facesign-dialog";

export function ConnectWallet() {
  const [facesignOpen, setFacesignOpen] = useState(false);
  const [facesignLoading, setFacesignLoading] = useState(false);

  const handleFacesignClick = async () => {
    setFacesignLoading(true);

    try {
      const { FaceSignSignerProvider } = await import("@idos-network/kwil-infra/facesign");

      const enclaveUrl = import.meta.env.VITE_FACESIGN_ENCLAVE_URL;
      if (!enclaveUrl) {
        throw new Error("VITE_FACESIGN_ENCLAVE_URL is not set");
      }

      const provider = new FaceSignSignerProvider({
        metadata: {
          name: "idOS Dashboard",
          description: "Connect to idOS Dashboard with FaceSign",
        },
        enclaveUrl,
      });

      const { hasKey } = await provider.preload();
      provider.destroy();

      if (hasKey) {
        dashboardActor.send({ type: "CONNECT_FACESIGN" });
      } else {
        setFacesignOpen(true);
      }
    } catch (error) {
      console.error("FaceSign preload failed:", error);
      setFacesignOpen(true);
    } finally {
      setFacesignLoading(false);
    }
  };

  const handleFacesignContinue = () => {
    setFacesignOpen(false);
    dashboardActor.send({ type: "CONNECT_FACESIGN" });
  };

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
      <div className="fixed inset-y-0 right-0 flex h-full w-full flex-col items-stretch overflow-y-auto bg-card p-5 md:items-center lg:w-[728px]">
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

          <h1 className="text-center font-normal text-xl">
            Manage your data and grants effortlessly with the idOS Dashboard.
          </h1>

          <p className="text-center font-normal">Connect your wallet to get started.</p>

          <div className="mx-auto flex w-full min-w-0 max-w-[400px] flex-col items-stretch gap-3">
            {import.meta.env.DEV ? (
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
            ) : null}
            <Button
              className="justify-between"
              size="xl"
              variant="secondary"
              onClick={() => dashboardActor.send({ type: "CONNECT_EVM" })}
            >
              Connect with a wallet
              <img alt="EVM logo" src="/wallet-connect.svg" width={36} height={36} />
            </Button>
            <Button
              className="justify-between"
              size="xl"
              variant="secondary"
              onClick={() => dashboardActor.send({ type: "CONNECT_NEAR" })}
            >
              Connect with NEAR
              <img alt="NEAR logo" src="/near.svg" width={40} height={40} />
            </Button>
            <Button
              className="justify-between"
              size="xl"
              variant="secondary"
              onClick={() => dashboardActor.send({ type: "CONNECT_XRPL" })}
            >
              Connect with XRP
              <img alt="XRP logo" src="/xrp.svg" width={40} height={40} />
            </Button>
            <Button
              className="justify-between"
              size="xl"
              variant="secondary"
              onClick={() => dashboardActor.send({ type: "CONNECT_STELLAR" })}
            >
              Connect with Stellar
              <img alt="Stellar logo" src="/stellar.svg" width={32} height={32} />
            </Button>
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-4">
          <span className="font-semibold text-sm">
            By connecting your wallet you confirm you read our{" "}
            <a
              className="inline-flex items-center gap-2 text-primary text-sm hover:underline hover:underline-offset-4"
              href="https://www.idos.network/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </a>{" "}
            and{" "}
            <a
              className="inline-flex items-center gap-2 text-primary text-sm hover:underline hover:underline-offset-4"
              href="https://drive.google.com/file/d/1lzrdgD_dwusE4xsKw_oTUcu8Hq3YU60b/view?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
            >
              Transparency Document
            </a>
          </span>
          <span className="flex place-content-center items-center gap-2 font-semibold text-sm">
            <span className="font-semibold text-sm">Powered by</span>
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
