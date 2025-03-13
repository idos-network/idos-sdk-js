"use client";

import { createIsleController } from "@idos-network/controllers";
import { useClickAway } from "@uidotdev/usehooks";
import { createContext, useContext, useEffect, useRef, useState } from "react";

interface IsleContextType {
  isle: ReturnType<typeof createIsleController> | null;
}

const IsleContext = createContext<IsleContextType | null>(null);

export function useIsle() {
  const context = useContext(IsleContext);
  if (!context) {
    throw new Error("`useIsle` must be used within an IsleProvider");
  }
  return context;
}

interface IsleProviderProps {
  children: React.ReactNode;
  containerId: string;
}

export function IsleProvider({ children, containerId }: IsleProviderProps) {
  const [isle, setIsle] = useState<ReturnType<typeof createIsleController> | null>(null);

  // Toggle isle animation from the outside
  const containerRef = useClickAway(() => {
    if (!isle) return;
    isle.toggleAnimation({
      expanded: false,
    });
  });

  // Initialize isle controller
  // biome-ignore lint/correctness/useExhaustiveDependencies: We intentionally omit isle from dependencies to prevent infinite loop. The isle check inside the effect ensures we don't create multiple instances.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isle) return;

    const controller = createIsleController({
      container: containerId,
      enclaveOptions: {
        container: "#idOS-enclave",
        url: "https://enclave.playground.idos.network",
      },
      credentialRequirements: {
        acceptedIssuers: [
          {
            meta: {
              url: "https://idos.network",
              name: "ACME Bank",
              logo: "https://avatars.githubusercontent.com/u/4081301?v=4",
            },
            authPublicKey: process.env.NEXT_PUBLIC_ISSUER_PUBLIC_KEY_HEX ?? "",
          },
        ],
        integratedConsumers: [
          {
            meta: {
              url: "https://idos.network",
              name: "ACME Bank",
              logo: "https://avatars.githubusercontent.com/u/4081301?v=4",
            },
            consumerPublicKey: process.env.NEXT_PUBLIC_ISSUER_PUBLIC_KEY_HEX ?? "",
          },
          {
            meta: {
              url: "https://idos.network",
              name: "Integrated Consumer",
              logo: "https://avatars.githubusercontent.com/u/4081302?v=4",
            },
            consumerPublicKey: "B809Hj90w6pY2J1fW3B8Cr26tOf4Lxbmy2yNy1XQYnY=",
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
    if (!isle) return;

    const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const currentTheme = darkModeMediaQuery.matches ? "dark" : "light";

    isle.send("update", { theme: currentTheme });

    const themeChangeHandler = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? "dark" : "light";
      isle.send("update", { theme: newTheme });
    };

    darkModeMediaQuery.addEventListener("change", themeChangeHandler);

    return () => {
      darkModeMediaQuery.removeEventListener("change", themeChangeHandler);
    };
  }, [isle]);

  return (
    <div className="relative">
      <IsleContext.Provider value={{ isle }}>
        {children}
        <div
          ref={containerRef as React.RefObject<HTMLDivElement>}
          id={containerId}
          className="absolute top-0 right-0 h-[600px] w-[380px] bg-transparent"
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
