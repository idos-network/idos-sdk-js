"use client";
import type { ISupportedWallet } from "@creit.tech/stellar-wallets-kit";
import * as GemWallet from "@gemwallet/api";
import { Button } from "@heroui/react";
import { getNearFullAccessPublicKeys } from "@idos-network/core";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { StrKey } from "@stellar/stellar-base";
import { TokenIcon } from "@web3icons/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import invariant from "tiny-invariant";
import { useAccount } from "wagmi";
import { useWalletStore } from "@/app/stores/wallet";
import { useNearWallet } from "@/near.provider";
import stellarKit from "@/stellar.config";
import DisconnectWallet from "./disconnect-wallet";
import WalletConnectIcon from "./icons/wallet-connect";
import XrpIcon from "./icons/xrp";
import Redirect from "./redirect";

const derivePublicKey = async (address: string) => {
  invariant(address, "Address is required");
  return Buffer.from(StrKey.decodeEd25519PublicKey(address)).toString("hex");
};

export default function MultiChainConnectWallet({
  hideConnect,
  hideDisconnect,
}: {
  hideConnect?: boolean;
  hideDisconnect?: boolean;
}) {
  const _router = useRouter();
  const { open } = useAppKit();
  const { setWalletType, setWalletAddress, setConnecting, setWalletPublicKey, walletAddress } =
    useWalletStore();
  const { isConnected: evmConnected } = useAppKitAccount();
  const { isConnected, address } = useAccount();
  const near = useNearWallet();

  const walletConnected = !!walletAddress;

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
    }
  }, [evmConnected, setWalletType]);

  useEffect(() => {
    if (isConnected) {
      setWalletAddress(address ?? null);
      setWalletPublicKey(address ?? null);
    }
  }, [isConnected, address, setWalletAddress, setWalletPublicKey]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: skipping for now
  useEffect(() => {
    const subscription = near.selector.store.observable.subscribe(async (state) => {
      if (state.accounts[0]) {
        const publicKeys = await getNearFullAccessPublicKeys(state.accounts[0].accountId ?? null);
        console.log({ publicKeys });
        const [account] = state.accounts;
        setWalletAddress(account.accountId ?? null);
        setWalletPublicKey(publicKeys?.[0] ?? null);
        setWalletType("near");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (walletConnected && !hideDisconnect) return <DisconnectWallet />;

  if (walletConnected) return <Redirect to="/onboarding" />;
  if (!walletConnected && hideConnect) return <Redirect to="/" />;

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
      <Button size="lg" onPress={() => near.modal.show()}>
        Connect a NEAR wallet
        <TokenIcon symbol="near" />
      </Button>

      <Button size="lg" onPress={connectStellarWallet}>
        Connect a Stellar wallet
        <TokenIcon symbol="xlm" />
      </Button>
    </div>
  );
}
