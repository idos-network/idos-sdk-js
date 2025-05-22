"use client";

import type { ISupportedWallet } from "@creit.tech/stellar-wallets-kit";
import type { Account } from "@idos-network/controllers";
import { KwilSigner } from "@kwilteam/kwil-js";
import {
  type Provider,
  useAppKit,
  useAppKitAccount,
  useAppKitNetworkCore,
  useAppKitProvider,
  useDisconnect,
} from "@reown/appkit/react";
import { StrKey } from "@stellar/stellar-base";
import { BrowserProvider, JsonRpcSigner } from "ethers";
import { type JSX, createContext, useCallback, useContext, useEffect, useState } from "react";
import { useSignMessage } from "wagmi";
import kit from "./stellar.config";

type WalletProviderType = "reown" | "stellar";
export type WalletType = "EVM" | "STELLAR";

interface WalletContextType {
  initialized: boolean;
  walletType: WalletType | null;
  isConnected: boolean;
  connect: (type: WalletProviderType) => Promise<void>;
  disconnect: () => Promise<void>;
  address: string | null;
  account: Account | null;
  signMessage: (message: string) => Promise<string>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function useWalletController() {
  const context = useContext(WalletContext);

  if (!context) {
    throw new Error("`useWalletController` must be used within a `WalletProvider`");
  }
  return context;
}

interface WalletProviderProps {
  children: JSX.Element;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [initialized, setInitialized] = useState(false);
  const [walletProviderType, setWalletProviderType] = useState<WalletProviderType | null>(null);
  const [walletType, setWalletType] = useState<WalletType | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);

  // Reown/appkit methods
  const { disconnect: disconnectReown } = useDisconnect();
  const { isConnected: isConnectedReown, address: addressReown } = useAppKitAccount();
  const { open: openReown } = useAppKit();
  const { signMessageAsync: signMessageReown } = useSignMessage();
  const { chainId: reownChainId } = useAppKitNetworkCore();
  const { walletProvider: reownWalletProvider } = useAppKitProvider<Provider>("eip155");

  // Initialize isle controller for Reown
  // biome-ignore lint/correctness/useExhaustiveDependencies: This is on purpose
  useEffect(() => {
    // Load data from local storage
    const storedWalletType = localStorage.getItem("walletType");
    if (storedWalletType) {
      setWalletType(storedWalletType as WalletType);
    }

    const storedAddress = localStorage.getItem("walletAddress");
    if (storedAddress) {
      setAddress(storedAddress);
    }

    const storedIsConnected = localStorage.getItem("isConnected");
    if (storedIsConnected) {
      setIsConnected(storedIsConnected === "true");
    }

    const storedWalletProviderType = localStorage.getItem("walletProviderType");
    if (storedWalletProviderType) {
      setWalletProviderType(storedWalletProviderType as WalletProviderType);
    }

    // Check if accidentally @reown is connected
    if (isConnectedReown && addressReown) {
      setWalletProviderType("reown");
      setWalletType("EVM");
      setIsConnected(true);
      setAddress(addressReown);
    } else if (storedWalletType === "reown" && !isConnectedReown) {
      setWalletType(null);
      setWalletProviderType(null);
      setIsConnected(false);
      setAddress(null);
    }
  }, []);

  const connect = async (type: WalletProviderType) => {
    setWalletProviderType(type);

    try {
      if (type === "reown") {
        await openReown();
      } else if (type === "stellar") {
        await kit.openModal({
          onWalletSelected: async (option: ISupportedWallet) => {
            kit.setWallet(option.id);
            const { address } = await kit.getAddress();
            setAddress(address);
            setWalletType("STELLAR");
            // Do something else
          },
        });
        // Stellar connection logic will be implemented here
        // For now just a placeholder
        setIsConnected(true);
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      setIsConnected(false);
      throw error;
    }
  };

  // React to reown connection
  useEffect(() => {
    if (isConnectedReown && addressReown) {
      setWalletProviderType("reown");
      setWalletType("EVM");
      setIsConnected(true);
      setAddress(addressReown);
    }
  }, [isConnectedReown, addressReown]);

  const disconnect = async () => {
    try {
      if (walletProviderType === "reown") {
        await disconnectReown();
      } else if (walletProviderType === "stellar") {
        await kit.disconnect();
      }
      setAddress(null);
      setWalletType(null);
      setIsConnected(false);
      setAccount(null);
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
      throw error;
    }
  };

  const signMessage = useCallback(
    (message: string) => {
      if (walletProviderType === "reown") {
        return signMessageReown({ message });
      }
      if (walletProviderType === "stellar") {
        return kit.signMessage(message).then((x) => x.signedMessage);
      }

      throw new Error("No wallet type selected");
    },
    [walletProviderType, signMessageReown],
  );

  useEffect(() => {
    localStorage.setItem("walletType", walletType ?? "");
    localStorage.setItem("walletAddress", address ?? "");
    localStorage.setItem("walletProviderType", walletProviderType ?? "");
    localStorage.setItem("isConnected", isConnected.toString());
  }, [walletType, address, isConnected, walletProviderType]);

  const buildSigner = async () => {
    if (walletProviderType === "reown" && reownWalletProvider && addressReown) {
      const provider = new BrowserProvider(reownWalletProvider, reownChainId);
      const signer = new JsonRpcSigner(provider, addressReown);

      setAccount({
        address: addressReown,
        // TODO: This should be derived somehow from getAccount(wagmiConfig)
        status: "connected",
        signer,
      });
    } else if (walletProviderType === "stellar") {
      const publicKey = address
        ? Buffer.from(StrKey.decodeEd25519PublicKey(address)).toString("hex")
        : "";

      const signer = new KwilSigner(
        async (msg) => {
          let message = msg;

          if (typeof msg !== "string") {
            // @ts-expect-error A hack to make kwil-infra to work
            message = new TextDecoder().decode(msg);
          }

          // We have to encode message to base64
          const messageBase64 = Buffer.from(message).toString("base64");
          const result = await kit.signMessage(messageBase64);

          let signedMessage = Buffer.from(result.signedMessage, "base64");

          if (signedMessage.length > 64) {
            signedMessage = Buffer.from(signedMessage.toString(), "base64");
          }

          return signedMessage;
        },
        publicKey,
        "ed25519",
      );

      // @ts-expect-error A hack to make kwil-infra to work
      signer.publicAddress = address;

      setAccount({
        address: address ?? "",
        publicKey,
        status: "connected",
        signer,
      });
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (account) return;

    if (isConnected && address) {
      buildSigner();
    }

    setInitialized(true);
    // Reown wallet provider is required, because it's not initialized immediately
  }, [isConnected, walletType, address, account, reownWalletProvider]);

  return (
    <WalletContext.Provider
      value={{
        initialized,
        walletType,
        isConnected: isConnected && !!address,
        connect,
        disconnect,
        address,
        signMessage,
        account,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
