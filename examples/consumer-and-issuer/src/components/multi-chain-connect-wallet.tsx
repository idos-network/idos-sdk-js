"use client";
import { useWalletStore } from "@/app/stores/wallet";
import * as GemWallet from "@gemwallet/api";
import { Button } from "@heroui/react";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import invariant from "tiny-invariant";
import { useAccount } from "wagmi";
import DisconnectWallet from "./disconnect-wallet";
import WalletConnectIcon from "./icons/wallet-connect";
import XrpIcon from "./icons/xrp";

export default function MultiChainConnectWallet({
  hideConnect,
  hideDisconnect,
}: { hideConnect?: boolean; hideDisconnect?: boolean }) {
  const router = useRouter();
  const { open } = useAppKit();
  const {
    setWalletType,
    walletType,
    setWalletAddress,
    setConnecting,
    setWalletPublicKey,
    walletAddress,
    walletError,
    ...rest
  } = useWalletStore();
  const { isConnected: evmConnected } = useAppKitAccount();
  const { isConnected, address } = useAccount();
  const walletConnected = !!walletAddress;

  useEffect(() => {
    if (evmConnected) {
      setWalletType("evm");
    }
  }, [evmConnected, setWalletType]);

  useEffect(() => {
    if (isConnected) {
      setWalletAddress(address ?? null);
      setWalletPublicKey(address ?? null);
    }
  }, [isConnected, address, setWalletAddress, setWalletPublicKey]);

  useEffect(() => {
    if (walletConnected) {
      router.replace("/onboarding");
    } else {
      router.replace("/");
    }
  }, [walletConnected, router]);

  if (walletConnected && !hideDisconnect) return <DisconnectWallet />;

  if (hideConnect) return null;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <Button
        size="lg"
        onPress={() => {
          open();
        }}
      >
        Connect a EVM wallet
        <WalletConnectIcon />
      </Button>

      <Button
        size="lg"
        onPress={() => {
          setConnecting(true);
          GemWallet.isInstalled()
            .then((isInstalled) => {
              if (isInstalled.result.isInstalled) {
                GemWallet.getPublicKey().then((publicKey) => {
                  invariant(publicKey, "Public key is required");
                  setWalletType("xrpl");
                  setWalletAddress(publicKey.result?.address ?? null);
                  setWalletPublicKey(publicKey.result?.publicKey ?? null);
                });
              }
            })
            .catch(() => {
              setConnecting(false);
            });
        }}
      >
        Connect a XRP wallet
        <XrpIcon />
      </Button>
    </div>
  );
}
