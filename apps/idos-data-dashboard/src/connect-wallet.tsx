import { TokenIcon } from "@web3icons/react/dynamic";
import { Button } from "@/components/ui/button";
import { dashboardActor } from "@/machines/dashboard.actor";

export function ConnectWallet() {
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
      <div className="fixed inset-y-0 right-0 w-full lg:w-[728px] h-full p-5 bg-neutral-900 flex flex-col items-stretch md:items-center  overflow-y-auto">
        <div className="flex flex-col items-stretch md:items-center gap-8 flex-1 place-content-center">
          <img
            src="/logo.svg"
            alt="idOS Dashboard logo"
            className="w-52 h-auto mx-auto"
            loading="eager"
          />

          <h1 className="text-xl! font-normal text-center">
            Manage your data and grants effortlessly with the idOS Dashboard.
          </h1>

          <p className="font-normal text-center">Connect your wallet to get started.</p>

          <div className="flex flex-col items-stretch w-full max-w-[400px] min-w-0 gap-3 mx-aut">
            <Button
              className="justify-between"
              size="xl"
              variant="secondary"
              onClick={() => dashboardActor.send({ type: "CONNECT_EVM" })}
            >
              Connect a wallet
              <img alt="EVM logo" src="/wallet-connect.svg" className="w-9 h-9" />
            </Button>
            <Button
              className="justify-between"
              size="xl"
              variant="secondary"
              onClick={() => dashboardActor.send({ type: "CONNECT_NEAR" })}
            >
              Connect with NEAR
              <img alt="NEAR logo" src="/near.svg" className="w-10 h-10" />
            </Button>
            <Button
              className="justify-between"
              size="xl"
              variant="secondary"
              onClick={() => dashboardActor.send({ type: "CONNECT_XRPL" })}
            >
              Connect with XRP
              <img alt="XRP logo" src="/xrp.svg" className="w-10 h-10" />
            </Button>
            <Button
              className="justify-between"
              size="xl"
              variant="secondary"
              onClick={() => dashboardActor.send({ type: "CONNECT_STELLAR" })}
            >
              Connect with Stellar
              <TokenIcon symbol="xlm" className="min-w-10 min-h-10" />
            </Button>
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-4">
          <span className="text-sm font-semibold">
            By connecting your wallet you confirm you read our{" "}
            <a
              className="text-primary inline-flex items-center text-sm hover:underline-offset-4  gap-2 hover:underline"
              href="https://www.idos.network/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </a>{" "}
            and{" "}
            <a
              className="text-primary inline-flex items-center text-sm hover:underline-offset-4  gap-2 hover:underline"
              href="https://drive.google.com/file/d/1lzrdgD_dwusE4xsKw_oTUcu8Hq3YU60b/view?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
            >
              Transparency Document
            </a>
          </span>
          <span className="flex gap-2 items-center place-content-center font-semibold text-sm">
            <span className="text-sm font-semibold">Powered by</span>
            <img src="/logo.svg" alt="idOS logo" className="w-[68px] h-auto" />
          </span>
        </div>
      </div>
    </div>
  );
}
