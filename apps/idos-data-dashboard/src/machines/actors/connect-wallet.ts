import type { ISupportedWallet } from "@creit.tech/stellar-wallets-kit";
import { watchAccount } from "@wagmi/core";
import { fromPromise } from "xstate";
import { appKit, getEvmAccount, openEvmModal, wagmiConfig } from "@/core/wagmi";
import { createFaceSignProvider } from "@/lib/facesign";
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
        const { connector } = await import("@/core/near");

        try {
          const { wallet, accounts } = await connector.getConnectedWallet();

          if (wallet && accounts.length > 0) {
            const accountId = accounts[0]?.accountId;
            return {
              walletAddress: accountId,
              walletPublicKey: accountId,
            };
          }
        } catch (err) {
          console.error("No wallet connected", err);
        }

        return new Promise<ConnectWalletOutput>((resolve, reject) => {
          connector.once("wallet:signIn", ({ accounts, success }) => {
            const accountId = accounts[0]?.accountId;

            if (!success || !accountId) {
              reject(new Error("No NEAR account found after sign-in"));
            }

            resolve({
              walletAddress: accountId,
              walletPublicKey: accountId,
            });
          });

          connector.connect().catch((err) => reject(err));
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
        };
      }

      case "FaceSign": {
        const { setFaceSignProvider } = await import("@/core/signers");

        const provider = await createFaceSignProvider();

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
