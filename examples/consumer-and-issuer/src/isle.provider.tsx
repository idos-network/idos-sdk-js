"use client";

import { createIsleController } from "@idos-network/controllers";
import { type JSX, createContext, useContext, useEffect, useState } from "react";

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

  // Initialize isle controller
  // biome-ignore lint/correctness/useExhaustiveDependencies: We intentionally omit isle from dependencies to prevent infinite loop. The isle check inside the effect ensures we don't create multiple instances.
  useEffect(() => {
    if (!containerId || isleController) return;

    const controller = createIsleController({
      container: containerId,
      theme: "light",
      issuerConfig: {
        meta: {
          url: "https://consumer-and-issuer-demo.vercel.app/",
          name: "NeoBank",
          logo: "https://consumer-and-issuer-demo.vercel.app/static/logo.svg",
        },
        encryptionPublicKey: process.env.NEXT_PUBLIC_ISSUER_ENCRYPTION_PUBLIC_KEY ?? "",
      },
      enclaveOptions: {
        container: "#idOS-enclave",
        url: "https://enclave.idos.network",
      },

      credentialRequirements: {
        acceptedIssuers: [
          {
            meta: {
              url: "https://consumer-and-issuer-demo.vercel.app/",
              name: "NeoBank",
              logo: "https://consumer-and-issuer-demo.vercel.app/static/logo.svg",
            },
            authPublicKey: process.env.NEXT_PUBLIC_ISSUER_AUTH_PUBLIC_KEY_HEX ?? "",
          },
        ],
        integratedConsumers: [
          {
            meta: {
              url: "https://consumer-and-issuer-demo.vercel.app/",
              name: "NeoBank",
              logo: "https://consumer-and-issuer-demo.vercel.app/static/logo.svg",
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
              url: "https://acme.com",
              name: "ACME Card Provider",
              logo: "https://consumer-and-issuer-demo.vercel.app/static/acme.svg",
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
  }, [containerId]);

  return (
    <div>
      {/* @ts-ignore */}
      <IsleContext.Provider value={{ isleController }}>{children}</IsleContext.Provider>
    </div>
  );
}
