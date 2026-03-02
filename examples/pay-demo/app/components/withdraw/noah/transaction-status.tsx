import { ethers } from "ethers";
import { useCallback, useEffect, useState } from "react";
import { Spinner } from "~/components/ui/spinner";
import { useCheckout } from "~/contexts/checkout-context";
import { calculateFiatAmount, formatFiatAmountForAPI } from "~/lib/utils";
import { erc20Abi, getNoahDepositAddress, type SupportedToken, TOKEN_INFO } from "~/lib/web3/erc20";
import { FlowError } from "../flow-error";
import { FlowSuccess } from "../flow-success";

const POLYGON_CHAIN_ID = 137; // Polygon mainnet
const POLYGON_CHAIN_ID_HEX = "0x89";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      isMetaMask?: boolean;
    };
  }
}

export interface TransactionAction {
  message: string;
  action: () => Promise<void>;
}

export function TransactionStatus({ actions }: { actions: TransactionAction[] }) {
  const [status, setStatus] = useState<"pending" | "success" | "failed">("pending");
  const [currentMessage, setCurrentMessage] = useState(
    actions[0]?.message || "Transaction pending",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!actions.length) return;

    const executeActions = async () => {
      try {
        for (let i = 0; i < actions.length; i++) {
          setCurrentMessage(actions[i].message);
          await actions[i].action();
        }
        setStatus("success");
      } catch (err) {
        console.error("Transaction action failed:", err);
        setError(err instanceof Error ? err.message : "Transaction failed");
        setStatus("failed");
      }
    };

    executeActions();
  }, [actions]);

  if (status === "failed") {
    return (
      <FlowError
        message={error || "Transaction failed"}
        onRetry={() => {
          setStatus("pending");
          setError(null);
          setCurrentMessage(actions[0]?.message || "Transaction pending");
        }}
      />
    );
  }

  if (status === "success") {
    return (
      <FlowSuccess
        title="Transaction Complete"
        message="Your withdrawal has been successfully submitted. Funds will be transferred to your bank account shortly."
      />
    );
  }

  return (
    <div className="flex min-h-[475px] w-full max-w-md flex-col items-center justify-center gap-4">
      <Spinner className="size-8" />
      <p className="text-muted-foreground text-sm">{currentMessage}</p>
    </div>
  );
}

export function useTransactionActions() {
  const { token, withdrawAmount, formData, channelId, paymentMethod, country } = useCheckout();

  const tokenConfig = TOKEN_INFO[token as SupportedToken] ?? {
    address: "",
    decimals: 18,
  };

  // Helper to get current chain ID
  const getCurrentChainId = async (): Promise<number> => {
    if (!window.ethereum) {
      throw new Error("MetaMask not found");
    }
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    return Number.parseInt(chainId as string, 16);
  };

  // Helper to switch to Polygon
  const switchToPolygon = async (): Promise<void> => {
    if (!window.ethereum) {
      throw new Error("MetaMask not found");
    }

    const currentChainId = await getCurrentChainId();
    if (currentChainId === POLYGON_CHAIN_ID) {
      return; // Already on Polygon
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: POLYGON_CHAIN_ID_HEX }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        // Add Polygon to MetaMask
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: POLYGON_CHAIN_ID_HEX,
              chainName: "Polygon Mainnet",
              nativeCurrency: {
                name: "MATIC",
                symbol: "MATIC",
                decimals: 18,
              },
              rpcUrls: ["https://polygon-rpc.com"],
              blockExplorerUrls: ["https://polygonscan.com"],
            },
          ],
        });
      } else {
        throw switchError;
      }
    }
  };

  // Helper to get provider and signer
  const getProviderAndSigner = async (): Promise<{
    provider: ethers.BrowserProvider;
    signer: ethers.JsonRpcSigner;
  }> => {
    if (!window.ethereum) {
      throw new Error("MetaMask not found");
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return { provider, signer };
  };

  // Helper function to wait for Noah's balance to be sufficient
  const waitForNoahBalance = useCallback(async (cryptoCurrency: string, requiredAmount: string) => {
    const maxAttempts = 15;
    const pollInterval = 1000 * 90; // 90 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch("/app/noah/accounts");
        const accounts = await response.json();
        const account = accounts.Items?.find((item: any) => item.CryptoCurrency === cryptoCurrency);

        if (account) {
          const availableBalance = Number.parseFloat(account.Available || "0");
          const required = Number.parseFloat(requiredAmount);

          if (availableBalance >= required) {
            return; // Balance is sufficient
          }
        }
      } catch (error) {
        console.error("Error checking Noah balance:", error);
      }

      // Wait before next attempt
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error("Timeout waiting for Noah balance. Please try again later.");
  }, []);

  const createTransactionActions = useCallback((): TransactionAction[] => {
    if (!token || !withdrawAmount || !formData || !channelId || !country) {
      return [];
    }

    // Map token to Noah's crypto currency format
    const cryptoCurrency =
      token === "USDC0" || token === "USDC"
        ? "USDC"
        : token === "USDT0" || token === "USDT"
          ? "USDT"
          : token === "POL"
            ? "MATIC"
            : token;

    // Get Noah's deposit address
    const noahDepositAddress = getNoahDepositAddress(token as SupportedToken);
    if (!noahDepositAddress) {
      return [];
    }

    // Store prepare result in closure
    let finalPrepareResult: any = null;

    return [
      {
        message: "Switching to Polygon network",
        action: async () => {
          await switchToPolygon();
        },
      },
      {
        message: "Sending crypto to Noah",
        action: async () => {
          const { provider, signer } = await getProviderAndSigner();
          const transferAmount = BigInt(Math.floor(withdrawAmount * 10 ** tokenConfig.decimals));

          let tx: ethers.ContractTransactionResponse;

          if (tokenConfig.isNative) {
            // Send native MATIC
            tx = await signer.sendTransaction({
              to: noahDepositAddress,
              value: transferAmount,
            });
          } else {
            if (!tokenConfig.address) {
              throw new Error("Token address is required");
            }

            // Send ERC20 token
            const contract = new ethers.Contract(tokenConfig.address, erc20Abi, signer);
            tx = await contract.transfer(noahDepositAddress, transferAmount);
          }

          // Wait for transaction receipt
          const receipt = await tx.wait();

          if (!receipt || receipt.status !== 1) {
            throw new Error("Transaction failed");
          }
        },
      },
      {
        message: "Waiting for Noah to receive funds",
        action: async () => {
          await waitForNoahBalance(cryptoCurrency, withdrawAmount.toString());
        },
      },
      {
        message: "Preparing payout",
        action: async () => {
          // Fetch channels again to get current rate and fee
          const channelsResponse = await fetch(
            `/app/noah/channels?${new URLSearchParams({
              countryCode: country.code,
              token: cryptoCurrency,
              fiatCurrency: country.currency,
            })}`,
          );
          const channelsData = await channelsResponse.json();
          const channel = channelsData.Items?.find((item: any) => item.ID === channelId);

          if (!channel) {
            throw new Error("Channel not found");
          }

          // Recalculate fiatAmount using current channel rate and fee
          const baseRate = Number(channel.Rate) || 0;
          const totalFee = Number(channel.Calculated?.TotalFee) || 0;
          const calculatedFiatAmount = calculateFiatAmount(withdrawAmount, baseRate, totalFee);

          // Format fiatAmount to correct decimal places for the currency
          const formattedFiatAmount = formatFiatAmountForAPI(calculatedFiatAmount);

          // Get customer ID (TODO: get from user context/machine)
          const customerId = "user-id-placeholder"; // Replace with actual customer ID

          // Prepare payout
          const prepareResponse = await fetch("/app/noah/payout-prepare", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customerId,
              channelId,
              cryptoCurrency,
              fiatAmount: formattedFiatAmount,
              form: formData,
              paymentMethod,
            }),
          });

          if (!prepareResponse.ok) {
            const errorData = await prepareResponse.json();
            throw new Error(errorData.error || "Failed to prepare payout");
          }

          finalPrepareResult = await prepareResponse.json();
        },
      },
      {
        message: "Submitting payout",
        action: async () => {
          if (!finalPrepareResult) {
            throw new Error("Prepare result not available");
          }

          // Fetch channels again to get current rate and fee for submit
          const channelsResponse = await fetch(
            `/app/noah/channels?${new URLSearchParams({
              countryCode: country.code,
              token: cryptoCurrency,
              fiatCurrency: country.currency,
            })}`,
          );
          const channelsData = await channelsResponse.json();
          const channel = channelsData.Items?.find((item: any) => item.ID === channelId);

          if (!channel) {
            throw new Error("Channel not found");
          }

          // Recalculate fiatAmount using current channel rate and fee
          const baseRate = Number(channel.Rate) || 0;
          const totalFee = Number(channel.Calculated?.TotalFee) || 0;
          const calculatedFiatAmount = calculateFiatAmount(withdrawAmount, baseRate, totalFee);

          // Format fiatAmount to correct decimal places for the currency
          const formattedFiatAmount = formatFiatAmountForAPI(calculatedFiatAmount);

          const customerId = "user-id-placeholder"; // Replace with actual customer ID

          const submitResponse = await fetch("/app/noah/payout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customerId,
              cryptoCurrency,
              fiatAmount: formattedFiatAmount,
              cryptoAuthorizedAmount: finalPrepareResult.CryptoAuthorizedAmount,
              formSessionId: finalPrepareResult.FormSessionID,
            }),
          });

          if (!submitResponse.ok) {
            const errorData = await submitResponse.json();
            throw new Error(errorData.error || "Failed to submit payout");
          }

          const submitResult = await submitResponse.json();

          // Check transaction status
          if (submitResult.Transaction?.Status === "Failed") {
            throw new Error("Transaction failed");
          }
        },
      },
    ];
  }, [
    token,
    withdrawAmount,
    formData,
    channelId,
    country,
    tokenConfig,
    waitForNoahBalance,
    paymentMethod,
  ]);

  return createTransactionActions();
}
