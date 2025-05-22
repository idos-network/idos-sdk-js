"use client";

import { createIsleController } from "@idos-network/controllers";
import { type JSX, createContext, useContext, useEffect, useState } from "react";
import invariant from "tiny-invariant";
import { useWalletController } from "./wallet.provider";

type IsleController = ReturnType<typeof createIsleController>;

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
  const { account } = useWalletController();

  // Initialize isle controller
  // biome-ignore lint/correctness/useExhaustiveDependencies: We intentionally omit isle from dependencies to prevent infinite loop. The isle check inside the effect ensures we don't create multiple instances.
  useEffect(() => {
    if (!containerId || isleController || !account) return;

    invariant(
      process.env.NEXT_PUBLIC_CONSUMER_AND_ISSUER_DEMO_URL,
      "`NEXT_PUBLIC_CONSUMER_AND_ISSUER_DEMO_URL` is not set",
    );
    invariant(
      process.env.NEXT_PUBLIC_ACME_CARD_PROVIDER_DEMO_URL,
      "`NEXT_PUBLIC_ACME_CARD_PROVIDER_DEMO_URL` is not set",
    );

    const controller = createIsleController({
      container: containerId,
      targetOrigin: process.env.NEXT_PUBLIC_ISLE_TARGET_ORIGIN ?? "https://isle.idos.network",
      theme: "light",
      account,
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
            consumerEncryptionPublicKey: process.env.NEXT_PUBLIC_ISSUER_ENCRYPTION_PUBLIC_KEY ?? "",
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
            consumerAuthPublicKey: process.env.NEXT_PUBLIC_OTHER_CONSUMER_SIGNING_PUBLIC_KEY ?? "",
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

    return () => {
      controller.destroy();
      setIsle(null);
    };
  }, [containerId, account]);

  return (
    <div>
      {/* @ts-ignore */}
      <IsleContext.Provider value={{ isleController }}>{children}</IsleContext.Provider>
    </div>
  );
}
