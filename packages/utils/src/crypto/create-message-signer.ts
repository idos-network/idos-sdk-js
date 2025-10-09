import type { WalletType } from "./index";

interface EvmSigner {
  signMessageAsync?: (args: { message: string }) => Promise<string>;
  signMessage?: (message: string) => Promise<string>;
}

interface NonEvmSigner {
  signMessage: (message: string) => Promise<{ signedMessage: string }>;
}

type AnySigner = EvmSigner | NonEvmSigner | (EvmSigner & NonEvmSigner);

export interface MessageSigner {
  signMessage: (message: string) => Promise<string>;
}

export function createMessageSigner(signer: AnySigner, walletType: WalletType): MessageSigner {
  switch (walletType) {
    case "evm": {
      const evmSigner = signer as EvmSigner;

      if (evmSigner.signMessageAsync) {
        return {
          signMessage: async (message: string): Promise<string> => {
            return await evmSigner.signMessageAsync!({ message: message });
          },
        };
      }

      if (evmSigner.signMessage) {
        return {
          signMessage: async (message: string): Promise<string> => {
            return await evmSigner.signMessage!(message);
          },
        };
      }

      throw new Error("EVM signer must have either signMessageAsync or signMessage method");
    }
    case "xrpl":
    case "near": {
      const nonEvmSigner = signer as NonEvmSigner;
      return {
        signMessage: async (message: string): Promise<string> => {
          const result = await nonEvmSigner.signMessage(message);
          console.log("Non-EVM signer result", result);
          return result.signedMessage;
        },
      };
    }
    case "stellar": {
      const stellarSigner = signer as NonEvmSigner;
      return {
        signMessage: async (message: string): Promise<string> => {
          const result = await stellarSigner.signMessage(message);
          const signedMessage = Buffer.from(result.signedMessage, "base64");
          return signedMessage.toString("hex");
        },
      };
    }

    default:
      throw new Error(`Cannot sign message. Unknown wallet type: ${walletType}`);
  }
}
