import type { ISupportedWallet } from "@creit.tech/stellar-wallets-kit";
import { watchAccount } from "@wagmi/core";
import { fromPromise } from "xstate";
<<<<<<< HEAD
import { COMMON_ENV } from "@/core/envFlags.common";
=======
>>>>>>> deef743c (Additional debug)
import { appKit, getEvmAccount, openEvmModal, wagmiConfig } from "@/core/wagmi";
import type { ConnectWalletInput, ConnectWalletOutput } from "../dashboard.machine";

export const connectWallet = fromPromise<ConnectWalletOutput, ConnectWalletInput>(
  async ({ input }) => {
    switch (input.walletType) {
      case "EVM": {
        const existingAccount = getEvmAccount();
        if (existingAccount.isConnected && existingAccount.address) {
          return {
            walletAddress: existingAccount.address,
            walletPublicKey: existingAccount.address,
            nearSelector: input.nearSelector,
          };
        }

        openEvmModal();

        return new Promise<ConnectWalletOutput>((resolve, reject) => {
          let connected = false;
          let modalOpened = false;

          const unwatch = watchAccount(wagmiConfig, {
            onChange(account) {
              if (account.isConnected && account.address) {
                connected = true;
                unwatch();
                unsubscribeState();
                resolve({
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
              reject(new Error("Connection cancelled"));
            }
          });
        });
      }

      case "NEAR": {
        const { getNearModal, initializeNearSelector, openNearModal } = await import("@/core/near");

        const selector = input.nearSelector ?? (await initializeNearSelector());

        if (selector.isSignedIn()) {
          const accounts = selector.store.getState().accounts;
          const accountId = accounts[0]?.accountId;
          if (accountId) {
            return {
              walletAddress: accountId,
              walletPublicKey: accountId,
              nearSelector: selector,
            };
          }
        }

        openNearModal(selector);

        return new Promise<ConnectWalletOutput>((resolve, reject) => {
          let signedIn = false;

          const subscription = selector.on("signedIn", ({ accounts }) => {
            signedIn = true;
            subscription.remove();
            hideSubscription?.remove();
            const accountId = accounts[0]?.accountId;
            if (accountId) {
              resolve({
                walletAddress: accountId,
                walletPublicKey: accountId,
                nearSelector: selector,
              });
            } else {
              reject(new Error("No NEAR account found after sign-in"));
            }
          });

          const modal = getNearModal();
          const hideSubscription = modal?.on("onHide", ({ hideReason }) => {
            if (!signedIn && hideReason === "user-triggered") {
              subscription.remove();
              hideSubscription?.remove();
              reject(new Error("Connection cancelled"));
            }
          });
        });
      }

      case "Stellar": {
        const { default: stellarKit } = await import("@/core/stellar-kit");
        const { StrKey } = await import("@stellar/stellar-base");

        return new Promise<ConnectWalletOutput>((resolve, reject) => {
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
                resolve({
                  walletAddress: address,
                  walletPublicKey: publicKey,
                  nearSelector: input.nearSelector,
                });
              } catch (err) {
                reject(
                  new Error(
                    err instanceof Error ? err.message : "Failed to connect Stellar wallet",
                  ),
                );
              }
            },
            onClosed: () => {
              if (!walletSelected) {
                reject(new Error("Connection cancelled"));
              }
            },
          });
        });
      }

      case "XRPL": {
        const GemWallet = await import("@gemwallet/api");
        const { getGemWalletPublicKey } = await import("@idos-network/kwil-infra/xrp-utils");

        const res = await GemWallet.isInstalled();
        if (!res.result.isInstalled) {
          window.open(
            "https://chromewebstore.google.com/detail/gemwallet/egebedonbdapoieedfcfkofloclfghab?hl=en",
            "_blank",
          );
          throw new Error("GemWallet is not installed");
        }

        const publicKey = await getGemWalletPublicKey(GemWallet);
        if (!publicKey) {
          throw new Error("Failed to get XRPL public key");
        }
        if (!publicKey.address) {
          throw new Error("XRPL wallet returned no address");
        }

        return {
          walletAddress: publicKey.address,
          walletPublicKey: publicKey.publicKey ?? "",
          nearSelector: input.nearSelector,
        };
      }

      case "FaceSign": {
        const { FaceSignSignerProvider } = await import("@idos-network/kwil-infra/facesign");
        const { setFaceSignProvider } = await import("@/core/signers");

        const enclaveUrl = COMMON_ENV.FACESIGN_ENCLAVE_URL;
        if (!enclaveUrl) {
          throw new Error("VITE_FACESIGN_ENCLAVE_URL is not set");
        }

        const provider = new FaceSignSignerProvider({
          metadata: {
            name: "idOS Dashboard",
            description: "Connect to idOS Dashboard with FaceSign",
          },
          enclaveUrl,
        });

        try {
          const address = await provider.init();
          setFaceSignProvider(provider);
          return {
            walletAddress: address,
            walletPublicKey: address,
            nearSelector: null,
          };
        } catch (err) {
          provider.destroy();
          throw new Error(err instanceof Error ? err.message : "FaceSign connection failed");
        }
      }

      default:
        throw new Error(`Unsupported wallet type: ${input.walletType}`);
    }
  },
);