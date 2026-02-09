import type { ISupportedWallet } from "@creit.tech/stellar-wallets-kit";
import * as GemWallet from "@gemwallet/api";
import { getGemWalletPublicKey } from "@idos-network/core";
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
      setWalletType("evm");
      setWalletAddress(address ?? null);
      setWalletPublicKey(address ?? null);
    }
  }, [evmConnected, address, setWalletType, setWalletAddress, setWalletPublicKey]);

  useEffect(() => {
    if (accountId) {
      setWalletType("near");
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
      <div className="fixed inset-y-0 right-0 flex h-full w-full flex-col items-stretch overflow-y-auto bg-neutral-900 p-5 md:items-center lg:w-[728px]">
        <div className="flex flex-1 flex-col place-content-center items-stretch gap-5 md:items-center">
          <img
            src="/idos-dashboard-logo.svg"
            alt="idOS Dashboard logo"
            className="mx-auto h-auto w-52"
            loading="eager"
          />

          <h1 className="text-center font-normal text-xl!">
            Manage your data and grants effortlessly with the idOS Dashboard.
          </h1>

          <h2 className="text-center font-normal text-sm">Connect your wallet to get started.</h2>

          <div className="mx-aut flex w-full min-w-0 max-w-[400px] flex-col items-stretch gap-3">
            <Button
              className="justify-between"
              size="xl"
              variant="secondary"
              onClick={() => open()}
            >
              Connect a wallet
              <img alt="EVM logo" src="/wallet-connect.svg" className="h-9 w-9" />
            </Button>
            <Button
              className="justify-between"
              size="xl"
              variant="secondary"
              onClick={() => modal.show()}
            >
              Connect with NEAR
              <img alt="NEAR logo" src="/near.svg" className="h-10 w-10" />
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
                      setWalletType("xrpl");
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
              <img alt="XRP logo" src="/xrp.svg" className="h-10 w-10" />
            </Button>
            <Button
              className="justify-between"
              size="xl"
              variant="secondary"
              onClick={connectStellarWallet}
            >
              Connect with Stellar
              <TokenIcon symbol="xlm" className="min-h-10 min-w-10" />
            </Button>
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-2">
          <span className="font-semibold text-sm">
            By connecting your wallet you confirm you read our{" "}
            <a
              className="hover:underline! inline-flex items-center gap-2 text-green-200! text-sm hover:text-green-400! hover:underline-offset-4"
              href="https://www.idos.network/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </a>{" "}
            and{" "}
            <a
              className="hover:underline! inline-flex items-center gap-2 text-green-200! text-sm hover:text-green-400! hover:underline-offset-4"
              href="https://drive.google.com/file/d/1lzrdgD_dwusE4xsKw_oTUcu8Hq3YU60b/view?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
            >
              Transparency Document
            </a>
          </span>
          <span className="flex place-content-center items-center gap-2 font-semibold text-sm">
            <span className="font-semibold text-sm">POWERED BY</span>
            <img src="/idos-logo.svg" alt="idOS logo" className="h-auto w-[68px]" />
          </span>
        </div>
      </div>
    </div>
  );
};
