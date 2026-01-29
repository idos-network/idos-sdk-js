import type { ISupportedWallet } from "@creit.tech/stellar-wallets-kit";
import * as GemWallet from "@gemwallet/api";
import { getGemWalletPublicKey } from "@idos-network/kwil-infra/xrp-utils";
import { StrKey } from "@stellar/stellar-base";
import { TokenIcon } from "@web3icons/react/dynamic";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useEffect } from "react";
import invariant from "tiny-invariant";
import { useAccount } from "wagmi";
import { useWalletSelector } from "@/core/near";
import { Button } from "./components/ui/button";
import stellarKit from "./core/stellar-kit";
import { useWalletStore } from "./stores/wallet";

const derivePublicKey = async (address: string) => {
  invariant(address, "Address is required");
  return Buffer.from(StrKey.decodeEd25519PublicKey(address)).toString("hex");
};

export const ConnectWallet = () => {
  const { open } = useWeb3Modal();
  const { modal } = useWalletSelector();
  const { address, isConnected: evmConnected } = useAccount();
  const { setWalletType, setWalletAddress, setWalletPublicKey } = useWalletStore();
  const { accountId } = useWalletSelector();

  const connectStellarWallet = async () => {
    await stellarKit.openModal({
      onWalletSelected: async (option: ISupportedWallet) => {
        stellarKit.setWallet(option.id);
        const { address } = await stellarKit.getAddress();
        const publicKey = await derivePublicKey(address);
        setWalletAddress(address);
        setWalletPublicKey(publicKey);
        setWalletType("Stellar");
      },
    });
  };

  useEffect(() => {
    if (evmConnected) {
      setWalletType("EVM");
      setWalletAddress(address ?? null);
      setWalletPublicKey(address ?? null);
    }
  }, [evmConnected, address, setWalletType, setWalletAddress, setWalletPublicKey]);

  useEffect(() => {
    if (accountId) {
      setWalletType("NEAR");
      setWalletAddress(accountId ?? null);
      setWalletPublicKey(accountId ?? null);
    }
  }, [accountId, setWalletType, setWalletAddress, setWalletPublicKey]);

  return (
    <div
      className="h-screen"
      style={{
        backgroundImage: "url('/cubes.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "repeat",
      }}
    >
      <div className="fixed inset-y-0 right-0 w-full lg:w-[728px] h-full p-5 bg-neutral-900 flex flex-col items-stretch md:items-center  overflow-y-auto">
        <div className="flex flex-col items-stretch md:items-center gap-5 flex-1 place-content-center">
          <img
            src="/idos-dashboard-logo.svg"
            alt="idOS Dashboard logo"
            className="w-52 h-auto mx-auto"
            loading="eager"
          />

          <h1 className="text-xl! font-normal text-center">
            Manage your data and grants effortlessly with the idOS Dashboard.
          </h1>

          <h2 className="text-sm font-normal text-center">Connect your wallet to get started.</h2>

          <div className="flex flex-col items-stretch w-full max-w-[400px] min-w-0 gap-3 mx-aut">
            <Button
              className="justify-between"
              size="xl"
              variant="secondary"
              onClick={() => open()}
            >
              Connect a wallet
              <img alt="EVM logo" src="/wallet-connect.svg" className="w-9 h-9" />
            </Button>
            <Button
              className="justify-between"
              size="xl"
              variant="secondary"
              onClick={() => modal.show()}
            >
              Connect with NEAR
              <img alt="NEAR logo" src="/near.svg" className="w-10 h-10" />
            </Button>
            <Button
              className="justify-between"
              size="xl"
              variant="secondary"
              onClick={() => {
                GemWallet.isInstalled().then((res) => {
                  if (res.result.isInstalled) {
                    getGemWalletPublicKey(GemWallet).then((publicKey) => {
                      invariant(publicKey, "Public key is required");
                      setWalletType("XRPL");
                      setWalletAddress(publicKey.address ?? null);
                      setWalletPublicKey(publicKey.publicKey ?? null);
                    });
                  } else {
                    alert("Please install GemWallet to connect with XRP");
                    window.open(
                      "https://chromewebstore.google.com/detail/gemwallet/egebedonbdapoieedfcfkofloclfghab?hl=en",
                      "_blank",
                    );
                  }
                });
              }}
            >
              Connect with XRP
              <img alt="XRP logo" src="/xrp.svg" className="w-10 h-10" />
            </Button>
            <Button
              className="justify-between"
              size="xl"
              variant="secondary"
              onClick={connectStellarWallet}
            >
              Connect with Stellar
              <TokenIcon symbol="xlm" className="min-w-10 min-h-10" />
            </Button>
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-2">
          <span className="text-sm font-semibold">
            By connecting your wallet you confirm you read our{" "}
            <a
              className="text-green-200! hover:text-green-400! inline-flex items-center text-sm hover:underline-offset-4  gap-2 hover:underline!"
              href="https://www.idos.network/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </a>{" "}
            and{" "}
            <a
              className="text-green-200! hover:text-green-400! inline-flex items-center text-sm hover:underline-offset-4  gap-2 hover:underline!"
              href="https://drive.google.com/file/d/1lzrdgD_dwusE4xsKw_oTUcu8Hq3YU60b/view?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
            >
              Transparency Document
            </a>
          </span>
          <span className="flex gap-2 items-center place-content-center font-semibold text-sm">
            <span className="text-sm font-semibold">POWERED BY</span>
            <img src="/idos-logo.svg" alt="idOS logo" className="w-[68px] h-auto" />
          </span>
        </div>
      </div>
    </div>
  );
};
