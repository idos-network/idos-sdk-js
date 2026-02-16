import type { ISupportedWallet } from "@creit.tech/stellar-wallets-kit";
import * as GemWallet from "@gemwallet/api";
import { getGemWalletPublicKey } from "@idos-network/kwil-infra/xrp-utils";
import { StrKey } from "@stellar/stellar-base";
import { watchAccount } from "@wagmi/core";
import { fromCallback } from "xstate";
import { initializeNearSelector, openNearModal } from "@/core/near";
import stellarKit from "@/core/stellar-kit";
import { getEvmAccount, openEvmModal, wagmiConfig } from "@/core/wagmi";
import type { ConnectWalletInput, DashboardEvent } from "../dashboard.machine";

const derivePublicKey = async (address: string): Promise<string> => {
  return Buffer.from(StrKey.decodeEd25519PublicKey(address)).toString("hex");
};

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

        const unwatch = watchAccount(wagmiConfig, {
          onChange(account) {
            if (account.isConnected && account.address) {
              unwatch();
              sendBack({
                type: "WALLET_CONNECTED",
                walletAddress: account.address,
                walletPublicKey: account.address,
                nearSelector: input.nearSelector,
              });
            }
          },
        });

        return () => {
          unwatch();
        };
      }

      case "NEAR": {
        const selectorPromise = input.nearSelector
          ? Promise.resolve(input.nearSelector)
          : initializeNearSelector();

        let cleanup: (() => void) | undefined;

        selectorPromise
          .then((selector) => {
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

            const subscription = selector.on("signedIn", ({ accounts }) => {
              subscription.remove();
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

            cleanup = () => {
              subscription.remove();
            };
          })
          .catch((err) => {
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
        stellarKit.openModal({
          onWalletSelected: async (option: ISupportedWallet) => {
            try {
              stellarKit.setWallet(option.id);
              const { address } = await stellarKit.getAddress();
              const publicKey = await derivePublicKey(address);
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
        });
        return;
      }

      case "XRPL": {
        (async () => {
          try {
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

            // @ts-expect-error GemWallet type mismatch between versions
            const publicKey = await getGemWalletPublicKey(GemWallet);
            if (!publicKey) {
              sendBack({
                type: "WALLET_CONNECT_ERROR",
                error: "Failed to get XRPL public key",
              });
              return;
            }

            sendBack({
              type: "WALLET_CONNECTED",
              walletAddress: publicKey.address ?? "",
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

      default:
        sendBack({
          type: "WALLET_CONNECT_ERROR",
          error: `Unsupported wallet type: ${input.walletType}`,
        });
    }
  },
);
