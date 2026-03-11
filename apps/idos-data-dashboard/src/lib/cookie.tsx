import * as Sentry from "@sentry/react-router";
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from "react";

import { useSelector } from "@/machines/provider";
import { selectWalletAddress, selectWalletType } from "@/machines/selectors";

// Version for cookie consent localStorage format
const COOKIE_CONSENT_VERSION = "1.0";

interface CookieContextValue {
  consent: number | null;
  isLoading: boolean;
  error: string | null;
  updateConsent: (accepted: number) => Promise<void>;
  clearConsent: () => void;
  hasConsent: boolean;
}

const CookieContext = createContext<CookieContextValue | null>(null);

interface CookieProviderProps {
  children: ReactNode;
}

export function CookieProvider({ children }: CookieProviderProps) {
  const [consent, setConsent] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sentryInitialized = useRef(false);
  const walletType = useSelector(selectWalletType);
  const walletAddress = useSelector(selectWalletAddress);

  const loadConsent = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const localConsentData = localStorage.getItem("cookieConsent");

      if (localConsentData) {
        const parsedData = JSON.parse(localConsentData);

        // Check if it's the old format (just a number/boolean) or new format (object with version)
        if (
          typeof parsedData === "object" &&
          parsedData !== null &&
          "version" in parsedData &&
          parsedData.version === COOKIE_CONSENT_VERSION
        ) {
          const parsedConsent = parsedData.consent;
          setConsent(parsedConsent);
        } else {
          // Version mismatch - clear it
          localStorage.removeItem("cookieConsent");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cookie consent");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConsent();
  }, []);

  useEffect(() => {
    if (walletType && walletAddress && sentryInitialized.current) {
      Sentry.setUser({
        type: walletType,
        address: walletAddress,
      });
    }
  }, [walletType, walletAddress, consent]);

  useEffect(() => {
    if (consent === null || consent === 0) return;

    if (!sentryInitialized.current && import.meta.env.VITE_SENTRY_DSN) {
      sentryInitialized.current = true;

      Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        sendDefaultPii: true,
        tracesSampleRate: 1.0,
        release: import.meta.env.VITE_SENTRY_RELEASE ?? "unknown",
        environment: import.meta.env.VITE_SENTRY_ENVIRONMENT ?? "unknown",
        beforeSend(event, hint) {
          const error = hint?.originalException;

          // Check against usual metamask errors, which we can't do anything about
          const ignoredMessages = [
            "user rejected the request",
            "user rejected action",
            "Request expired. Please try again.",
            "timeout of 10000ms exceeded",
            "proposal expired",
            "User closed the window",
            "connection declined",
          ];

          if (
            typeof error === "string" &&
            ignoredMessages.some((msg) => error.toLowerCase().includes(msg.toLowerCase()))
          ) {
            return null;
          }

          if (
            error instanceof Error &&
            ignoredMessages.some((msg) => error.message.toLowerCase().includes(msg.toLowerCase()))
          ) {
            return null;
          }

          // Allow to skip returns
          // Promise.reject({ error: 40001, message: 'User rejected the request' });
          if (
            error &&
            typeof error === "object" &&
            "message" in error &&
            typeof error.message === "string" &&
            ignoredMessages.some((msg) =>
              (error as any).message.toLowerCase().includes(msg.toLowerCase()),
            )
          ) {
            return null;
          }

          return event;
        },
      });

      // Set user immediately after initialization
      Sentry.setUser({
        type: walletType,
        address: walletAddress,
      });
    }
  }, [consent]);

  const updateConsent = async (accepted: number) => {
    setConsent(accepted);
    localStorage.setItem(
      "cookieConsent",
      JSON.stringify({
        consent: accepted,
        version: COOKIE_CONSENT_VERSION,
      }),
    );
  };

  const clearConsent = () => {
    setConsent(null);
    localStorage.removeItem("cookieConsent");
  };

  return (
    <CookieContext.Provider
      value={{
        consent,
        isLoading,
        error,
        updateConsent,
        clearConsent,
        hasConsent: consent !== null,
      }}
    >
      {children}
    </CookieContext.Provider>
  );
}

export function useCookieConsent() {
  const context = useContext(CookieContext);

  if (!context) {
    throw new Error("useCookieConsent must be used within a CookieProvider");
  }

  return context;
}
