import type { ISupportedWallet } from "@creit.tech/stellar-wallets-kit";
import type { FaceSignSignerProvider } from "@idos-network/kwil-infra/facesign";
import { watchAccount } from "@wagmi/core";
import { fromCallback } from "xstate";
import { appKit, getEvmAccount, openEvmModal, wagmiConfig } from "@/core/wagmi";
import type { ConnectWalletInput, DashboardEvent } from "../dashboard.machine";

export const connectWallet = fromCallback<DashboardEvent, ConnectWalletInput>(
  ({ sendBack, input }) => {
    switch (input.walletType) {
      case "EVM": {
        const existingAccount = getEvmAccount();
        if (existingAccount.isConnected && existingAccount.address) {
          sendBack({
            type: "WALLET_CONNECTED",
            walletAddress: existingAccount.address,
            walletPublicKey: existingAccount.address,
            nearSelector: input.nearSelector,
          });
          return;
        }

        openEvmModal();

        let connected = false;
        let modalOpened = false;

        const unwatch = watchAccount(wagmiConfig, {
          onChange(account) {
            if (account.isConnected && account.address) {
              connected = true;
              unwatch();
              unsubscribeState();
              sendBack({
                type: "WALLET_CONNECTED",
                walletAddress: account.address,
                walletPublicKey: account.address,
                nearSelector: input.nearSelector,
              });
            }
          },
        });

        const unsubscribeState = appKit.subscribeState((state) => {
          if (state.open) {
            modalOpened = true;
          }

          if (modalOpened && !state.open && !connected) {
            unwatch();
            unsubscribeState();
            sendBack({
              type: "WALLET_CONNECT_ERROR",
              error: "Connection cancelled",
            });
          }
        });

        return () => {
          unwatch();
          unsubscribeState();
        };
      }

      case "NEAR": {
        let cleanup: (() => void) | undefined;

        (async () => {
          const { getNearModal, initializeNearSelector, openNearModal } = await import(
            "@/core/near"
          );

          const selector = input.nearSelector ?? (await initializeNearSelector());

          if (selector.isSignedIn()) {
            const accounts = selector.store.getState().accounts;
            const accountId = accounts[0]?.accountId;
            if (accountId) {
              sendBack({
                type: "WALLET_CONNECTED",
                walletAddress: accountId,
                walletPublicKey: accountId,
                nearSelector: selector,
              });
              return;
            }
          }

          openNearModal(selector);

          let signedIn = false;

          const subscription = selector.on("signedIn", ({ accounts }) => {
            signedIn = true;
            subscription.remove();
            hideSubscription?.remove();
            const accountId = accounts[0]?.accountId;
            if (accountId) {
              sendBack({
                type: "WALLET_CONNECTED",
                walletAddress: accountId,
                walletPublicKey: accountId,
                nearSelector: selector,
              });
            } else {
              sendBack({
                type: "WALLET_CONNECT_ERROR",
                error: "No NEAR account found after sign-in",
              });
            }
          });

          const modal = getNearModal();
          const hideSubscription = modal?.on("onHide", ({ hideReason }) => {
            if (!signedIn && hideReason === "user-triggered") {
              subscription.remove();
              hideSubscription?.remove();
              sendBack({
                type: "WALLET_CONNECT_ERROR",
                error: "Connection cancelled",
              });
            }
          });

          cleanup = () => {
            subscription.remove();
            hideSubscription?.remove();
          };
        })().catch((err) => {
          sendBack({
            type: "WALLET_CONNECT_ERROR",
            error: err instanceof Error ? err.message : "Failed to initialize NEAR",
          });
        });

        return () => {
          cleanup?.();
        };
      }

      case "Stellar": {
        (async () => {
          const { default: stellarKit } = await import("@/core/stellar-kit");
          const { StrKey } = await import("@stellar/stellar-base");

          let walletSelected = false;

          stellarKit.openModal({
            onWalletSelected: async (option: ISupportedWallet) => {
              walletSelected = true;
              try {
                stellarKit.setWallet(option.id);
                const { address } = await stellarKit.getAddress();
                const publicKey = Buffer.from(StrKey.decodeEd25519PublicKey(address)).toString(
                  "hex",
                );
                sendBack({
                  type: "WALLET_CONNECTED",
                  walletAddress: address,
                  walletPublicKey: publicKey,
                  nearSelector: input.nearSelector,
                });
              } catch (err) {
                sendBack({
                  type: "WALLET_CONNECT_ERROR",
                  error: err instanceof Error ? err.message : "Failed to connect Stellar wallet",
                });
              }
            },
            onClosed: () => {
              if (!walletSelected) {
                sendBack({
                  type: "WALLET_CONNECT_ERROR",
                  error: "Connection cancelled",
                });
              }
            },
          });
        })().catch((err) => {
          sendBack({
            type: "WALLET_CONNECT_ERROR",
            error: err instanceof Error ? err.message : "Failed to load Stellar wallet",
          });
        });
        return;
      }

      case "XRPL": {
        (async () => {
          try {
            const GemWallet = await import("@gemwallet/api");
            const { getGemWalletPublicKey } = await import("@idos-network/kwil-infra/xrp-utils");

            const res = await GemWallet.isInstalled();
            if (!res.result.isInstalled) {
              window.open(
                "https://chromewebstore.google.com/detail/gemwallet/egebedonbdapoieedfcfkofloclfghab?hl=en",
                "_blank",
              );
              sendBack({
                type: "WALLET_CONNECT_ERROR",
                error: "GemWallet is not installed",
              });
              return;
            }

            const publicKey = await getGemWalletPublicKey(GemWallet);
            if (!publicKey) {
              sendBack({
                type: "WALLET_CONNECT_ERROR",
                error: "Failed to get XRPL public key",
              });
              return;
            }

            if (!publicKey.address) {
              sendBack({
                type: "WALLET_CONNECT_ERROR",
                error: "XRPL wallet returned no address",
              });
              return;
            }

            sendBack({
              type: "WALLET_CONNECTED",
              walletAddress: publicKey.address,
              walletPublicKey: publicKey.publicKey ?? "",
              nearSelector: input.nearSelector,
            });
          } catch (err) {
            sendBack({
              type: "WALLET_CONNECT_ERROR",
              error: err instanceof Error ? err.message : "Failed to connect XRPL wallet",
            });
          }
        })();
        return;
      }

      case "FaceSign": {
        let provider: FaceSignSignerProvider | null = null;
        let connected = false;

        (async () => {
          const { FaceSignSignerProvider } = await import("@idos-network/kwil-infra/facesign");
          const { setFaceSignProvider } = await import("@/core/signers");

          const enclaveUrl = import.meta.env.VITE_FACESIGN_ENCLAVE_URL;
          if (!enclaveUrl) {
            throw new Error("VITE_FACESIGN_ENCLAVE_URL is not set");
          }

          provider = new FaceSignSignerProvider({
            metadata: {
              name: "idOS Dashboard",
              description: "Connect to idOS Dashboard with FaceSign",
            },
            enclaveUrl,
          });

          const address = await provider.init();
          connected = true;
          setFaceSignProvider(provider);

          sendBack({
            type: "WALLET_CONNECTED",
            walletAddress: address,
            walletPublicKey: address,
            nearSelector: null,
          });
        })().catch((err) => {
          provider?.destroy();
          provider = null;
          sendBack({
            type: "WALLET_CONNECT_ERROR",
            error: err instanceof Error ? err.message : "FaceSign connection failed",
          });
        });

        return () => {
          if (!connected) {
            provider?.destroy();
            provider = null;
          }
        };
      }

      default:
        sendBack({
          type: "WALLET_CONNECT_ERROR",
          error: `Unsupported wallet type: ${input.walletType}`,
        });
    }
  },
);
