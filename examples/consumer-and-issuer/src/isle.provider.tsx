"use client";

import * as GemWallet from "@gemwallet/api";
import { createIsleController } from "@idos-network/controllers";
import type { WalletInfo } from "@idos-network/controllers";
import { signGemWalletTx, signNearMessage } from "@idos-network/core";
import { type Config, getWalletClient, signMessage } from "@wagmi/core";
import { BrowserProvider } from "ethers";
import { type JSX, createContext, useContext, useEffect, useState } from "react";
import invariant from "tiny-invariant";
import { wagmiAdapter } from "./app/providers";
import { useWalletStore } from "./app/stores/wallet";
import { useNearWallet } from "./near.provider";

type IsleController = ReturnType<typeof createIsleController>;

const getEvmSigner = async (wagmiConfig: Config) => {
  const walletClient = await getWalletClient(wagmiConfig);
  const provider = walletClient && new BrowserProvider(walletClient.transport);
  const signer = provider && (await provider.getSigner());
  return signer;
};

const walletInfoMapper = ({
  address,
  publicKey,
}: { address: string; publicKey: string }): Record<"evm" | "xrpl", WalletInfo> => ({
  evm: {
    address,
    publicKey,
    signMethod: (message: string) => signMessage(wagmiAdapter.wagmiConfig, { message: message }),
    type: "evm",
    signer: async () => await getEvmSigner(wagmiAdapter.wagmiConfig),
  },
  xrpl: {
    signMethod: async (message: string) => {
      const signature = await signGemWalletTx(GemWallet, message);
      return signature as string;
    },
    address,
    publicKey,
    type: "xrpl",
    signer: async () => GemWallet,
  },
});

interface IsleContextType {
  isleController: IsleController | null;
}

const IsleContext = createContext<IsleContextType | null>(null);

export function useIsleController() {
  const context = useContext(IsleContext);
  if (!context) {
    throw new Error("`useIsle` must be used within an `IsleProvider`");
  }
  return context;
}

interface IsleProviderProps {
  children: JSX.Element;
  containerId: string;
}

export function IsleProvider({ children, containerId }: IsleProviderProps) {
  const [isleController, setIsle] = useState<IsleController | null>(null);
  const { walletType, walletAddress, walletPublicKey } = useWalletStore();
  const near = useNearWallet();

  // Initialize isle controller
  // biome-ignore lint/correctness/useExhaustiveDependencies: We intentionally omit isle from dependencies to prevent infinite loop. The isle check inside the effect ensures we don't create multiple instances.
  useEffect(() => {
    if (!containerId || isleController) return;

    invariant(
      process.env.NEXT_PUBLIC_CONSUMER_AND_ISSUER_DEMO_URL,
      "`NEXT_PUBLIC_CONSUMER_AND_ISSUER_DEMO_URL` is not set",
    );
    invariant(
      process.env.NEXT_PUBLIC_ACME_CARD_PROVIDER_DEMO_URL,
      "`NEXT_PUBLIC_ACME_CARD_PROVIDER_DEMO_URL` is not set",
    );

    if (!walletType) return;

    const initializeController = async () => {
      if (!walletAddress || !walletPublicKey) return;

      // biome-ignore lint/suspicious/noExplicitAny: external signer can be any type
      let externalSigner: any = undefined;
      let walletInfo: WalletInfo;

      // Handle different wallet types
      if (walletType === "near") {
        // For NEAR wallets, create a mock walletInfo and pass the real signer externally
        try {
          externalSigner = await near.selector.wallet();
        } catch (error) {
          console.error("Failed to get NEAR wallet:", error);
          return;
        }

        // Create a mock walletInfo for NEAR (required by the interface)
        walletInfo = {
          address: walletAddress,
          publicKey: walletPublicKey,
          signMethod: async (message: string) => {
            const signature = await signNearMessage(externalSigner, message);
            return signature;
          },
          type: "near",
          signer: async () => {
            return externalSigner;
          },
        };
      } else {
        // For EVM and XRPL wallets, use the existing walletInfoMapper
        walletInfo = walletInfoMapper({
          address: walletAddress,
          publicKey: walletPublicKey,
        })[walletType as "evm" | "xrpl"];
      }

      const controller = createIsleController({
        container: containerId,
        walletInfo,
        // biome-ignore lint/suspicious/noExplicitAny: using `any` to avoid type errors.
        wagmiConfig: wagmiAdapter.wagmiConfig as unknown as any,
        xrpWallets: {
          gemWallet: GemWallet,
        },
        targetOrigin: process.env.NEXT_PUBLIC_ISLE_TARGET_ORIGIN ?? "https://isle.idos.network",
        theme: "light",
        issuerConfig: {
          meta: {
            url: process.env.NEXT_PUBLIC_CONSUMER_AND_ISSUER_DEMO_URL,
            name: "NeoBank",
            logo: `${process.env.NEXT_PUBLIC_CONSUMER_AND_ISSUER_DEMO_URL}/static/logo.svg`,
          },
          encryptionPublicKey: process.env.NEXT_PUBLIC_ISSUER_ENCRYPTION_PUBLIC_KEY ?? "",
        },
        enclaveOptions: {
          container: "#idOS-enclave",
          url: process.env.NEXT_PUBLIC_IDOS_ENCLAVE_URL ?? "",
        },

        credentialRequirements: {
          acceptedIssuers: [
            {
              meta: {
                url: process.env.NEXT_PUBLIC_CONSUMER_AND_ISSUER_DEMO_URL,
                name: "NeoBank",
                logo: `${process.env.NEXT_PUBLIC_CONSUMER_AND_ISSUER_DEMO_URL}/static/logo.svg`,
              },
              authPublicKey: process.env.NEXT_PUBLIC_ISSUER_AUTH_PUBLIC_KEY_HEX ?? "",
            },
          ],
          integratedConsumers: [
            {
              meta: {
                url: process.env.NEXT_PUBLIC_CONSUMER_AND_ISSUER_DEMO_URL,
                name: "NeoBank",
                logo: `${process.env.NEXT_PUBLIC_CONSUMER_AND_ISSUER_DEMO_URL}/static/logo.svg`,
              },
              consumerEncryptionPublicKey:
                process.env.NEXT_PUBLIC_ISSUER_ENCRYPTION_PUBLIC_KEY ?? "",
              consumerAuthPublicKey: process.env.NEXT_PUBLIC_ISSUER_AUTH_PUBLIC_KEY_HEX ?? "",
              kycPermissions: [
                "Name and last name",
                "Gender",
                "Country and city of residence",
                "Place and date of birth",
                "ID Document",
                "Liveness check (No pictures)",
              ],
            },
            {
              meta: {
                url: process.env.NEXT_PUBLIC_ACME_CARD_PROVIDER_DEMO_URL,
                name: "ACME Card Provider",
                logo: `${process.env.NEXT_PUBLIC_ACME_CARD_PROVIDER_DEMO_URL}/static/logo.svg`,
              },
              consumerEncryptionPublicKey:
                process.env.NEXT_PUBLIC_OTHER_CONSUMER_ENCRYPTION_PUBLIC_KEY ?? "",
              consumerAuthPublicKey:
                process.env.NEXT_PUBLIC_OTHER_CONSUMER_SIGNING_PUBLIC_KEY ?? "",
              kycPermissions: [
                "Name and last name",
                "Gender",
                "Country and city of residence",
                "Place and date of birth",
                "ID Document",
                "Liveness check (No pictures)",
              ],
            },
          ],
          acceptedCredentialType: "KYC DATA",
        },
      });

      setIsle(controller);
    };

    initializeController().catch((error) => {
      console.error("Failed to initialize isle controller:", error);
    });

    return () => {
      if (isleController) {
        isleController.destroy();
        setIsle(null);
      }
    };
  }, [containerId, walletType, walletAddress, walletPublicKey, near.selector]);

  return (
    <div>
      {/* @ts-ignore */}
      <IsleContext.Provider value={{ isleController }}>{children}</IsleContext.Provider>
    </div>
  );
}
