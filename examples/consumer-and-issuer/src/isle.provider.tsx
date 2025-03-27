"use client";

import { createIsleController } from "@idos-network/controllers";
import { useClickAway } from "@uidotdev/usehooks";
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

  // Toggle isle animation from the outside
  const containerRef = useClickAway(() => {
    if (!isleController) return;
    isleController.toggleAnimation({
      expanded: false,
    });
  });

  // Initialize isle controller
  // biome-ignore lint/correctness/useExhaustiveDependencies: We intentionally omit isle from dependencies to prevent infinite loop. The isle check inside the effect ensures we don't create multiple instances.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isleController) return;

    const controller = createIsleController({
      container: containerId,
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
          },
          {
            meta: {
              url: "https://acme.com",
              name: "ACME Card Provider",
              logo: "https://avatars.githubusercontent.com/u/4081302?v=4",
            },
            consumerEncryptionPublicKey:
              process.env.NEXT_PUBLIC_INTEGRATED_CONSUMER_ENCRYPTION_PUBLIC_KEY ?? "",
            consumerAuthPublicKey:
              process.env.NEXT_PUBLIC_INTEGRATED_CONSUMER_SIGNING_PUBLIC_KEY ?? "",
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

  // Handle theme changes
  useEffect(() => {
    if (!isleController) return;

    const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const currentTheme = darkModeMediaQuery.matches ? "dark" : "light";

    isleController.send("update", { theme: currentTheme });

    const themeChangeHandler = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? "dark" : "light";
      isleController.send("update", { theme: newTheme });
    };

    darkModeMediaQuery.addEventListener("change", themeChangeHandler);

    return () => {
      darkModeMediaQuery.removeEventListener("change", themeChangeHandler);
    };
  }, [isleController]);

  return (
    <div className="relative">
      {/* @ts-ignore */}
      <IsleContext.Provider value={{ isleController }}>
        {children}
        <div
          ref={containerRef as React.RefObject<HTMLDivElement>}
          id={containerId}
          className="absolute top-0 right-0 h-[800px] w-[380px] bg-transparent"
        />
        <div
          id="idos-root"
          className="invisible fixed top-0 left-0 z-[10000] flex aspect-square h-full w-full flex-col items-center justify-center bg-black/30 opacity-0 backdrop-blur-sm transition-[opacity,visibility] duration-150 ease-in [&:has(#idOS-enclave.visible)]:visible [&:has(#idOS-enclave.visible)]:opacity-100"
        >
          <div
            id="idOS-enclave"
            className="absolute top-[50%] left-[50%] z-[2] h-fit w-[200px] translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-lg bg-neutral-950"
          />
        </div>
      </IsleContext.Provider>
    </div>
  );
}
