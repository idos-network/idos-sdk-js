import type {
  NearWalletBase as NearWallet,
  SignedMessage,
  SignMessageParams,
} from "@hot-labs/near-connect";
import { KwilSigner } from "@idos-network/kwil-js";
import {
  base64Decode,
  binaryWriteUint16BE,
  borshSerialize,
  bs58Decode,
  bytesConcat,
  hexEncode,
  utf8Decode,
} from "@idos-network/utils/codecs";
import type { Store } from "@idos-network/utils/store";
import type { BlockReference, JsonRpcProvider, ViewAccessKeyListRequest } from "near-api-js";
import type { KwilActionClient } from "../create-kwil-client";
import { getNearNodeUrl } from "./get-config";

// Near copy & paste types
// since they don't expose them...
// https://github.com/near/near-api-js/blob/master/src/rpc/types.gen.ts#L803
export type CryptoHash = string;
export type PublicKey = string;
export type NearToken = string;
export type AccessKeyPermissionView =
  | "FullAccess"
  | {
      FunctionCall: {
        allowance?: NearToken | null;
        method_names: Array<string>;
        receiver_id: string;
      };
    };
export type AccessKeyView = {
  nonce: number;
  permission: AccessKeyPermissionView;
};
export type AccessKeyInfoView = {
  access_key: AccessKeyView;
  public_key: PublicKey;
};
export type RpcViewAccessKeyListResponse = {
  block_hash: CryptoHash;
  block_height: number;
  keys: Array<AccessKeyInfoView>;
};

export function looksLikeNearWallet(signer: unknown): signer is NearWallet {
  return (
    signer !== null &&
    typeof signer === "object" &&
    "manifest" in signer &&
    signer.manifest !== null &&
    typeof signer.manifest === "object" &&
    "id" in signer.manifest &&
    "name" in signer.manifest &&
    "signIn" in signer &&
    "signOut" in signer &&
    "getAccounts" in signer &&
    "signMessage" in signer &&
    "signAndSendTransaction" in signer
  );
}

class KwilNonce {
  bytes: Uint8Array;

  constructor(length = 32) {
    // We're in the browser, so there's a window.crypto for sure.
    /* global crypto */
    this.bytes = crypto.getRandomValues(new Uint8Array(length));
  }

  get clampUTF8() {
    return this.bytes.map((byte) => byte & 127);
  }
}

/**
 * Creates a signer function that can be used to sign messages with a NEAR wallet
 */
function createNearWalletSigner(
  wallet: NearWallet,
  recipient: string,
): (message: string | Uint8Array) => Promise<Uint8Array> {
  return async (message: string | Uint8Array): Promise<Uint8Array> => {
    const messageString = typeof message === "string" ? message : utf8Decode(message);

    if (!wallet.signMessage) {
      throw new Error("Only wallets with signMessage are supported.");
    }

    const nonceSuggestion = Buffer.from(new KwilNonce(32).bytes);

    const {
      nonce = nonceSuggestion,
      signature,
      // biome-ignore lint/style/noNonNullAssertion: Only non-signing wallets return void.
    } = (await (
      wallet.signMessage as (_: SignMessageParams) => Promise<SignedMessage & { nonce: Uint8Array }>
    )({
      message: messageString,
      recipient,
      nonce: nonceSuggestion,
    }))!;

    const nep413BorschSchema = {
      struct: {
        tag: "u32",
        message: "string",
        nonce: { array: { type: "u8", len: 32 } },
        recipient: "string",
        callbackUrl: { option: "string" },
      },
    };

    const nep413BorshParams = {
      tag: 2147484061,
      message: messageString,
      nonce: Array.from(nonce),
      recipient,
      callbackUrl: undefined,
    };

    const nep413BorshPayload = borshSerialize(nep413BorschSchema, nep413BorshParams);
    const result = bytesConcat(
      binaryWriteUint16BE(nep413BorshPayload.length),
      nep413BorshPayload,
      base64Decode(signature),
    );

    return result;
  };
}

export function implicitAddressFromPublicKey(publicKey: string): string {
  const key_without_prefix = publicKey.replace(/^ed25519:/, "");
  return hexEncode(bs58Decode(key_without_prefix));
}

export async function getNearFullAccessPublicKeys(
  namedAddress: string,
): Promise<string[] | undefined> {
  let providerKlass: typeof JsonRpcProvider;
  try {
    providerKlass = (await import("near-api-js")).JsonRpcProvider;
  } catch (_e) {
    throw new Error("Can't load near-api-js");
  }
  const nodeUrl = getNearNodeUrl(namedAddress);
  const provider = new providerKlass({ url: nodeUrl });

  try {
    const viewAccessKeyListRequest: ViewAccessKeyListRequest & BlockReference = {
      account_id: namedAddress,
      request_type: "view_access_key_list",
      finality: "final",
    };

    const accessKeyList =
      await provider.query<RpcViewAccessKeyListResponse>(viewAccessKeyListRequest);

    return accessKeyList.keys
      .filter((element) => element.access_key.permission === "FullAccess")
      ?.map((i) => i.public_key);
  } catch {
    // `Near` failed if namedAddress contains uppercase symbols
    return;
  }
}

export async function signNearMessage(
  wallet: NearWallet,
  message: string,
  recipient = "idos.network",
): Promise<string> {
  const signer = createNearWalletSigner(wallet, recipient);
  const signedPayload = await signer(message);
  return hexEncode(signedPayload);
}

export async function createNearWalletKwilSigner(
  wallet: NearWallet,
  currentAddress: string,
  store: Store,
  kwilClient: KwilActionClient,
  recipient = "idos.network",
): Promise<{ kwilSigner: KwilSigner; publicKey: string }> {
  if (!wallet.signMessage) throw new Error("Only wallets with signMessage are supported.");

  if (wallet.manifest.id === "mynearwallet") {
    const { accountId, signature, publicKey, error } = Object.fromEntries(
      new URLSearchParams(window.location.hash.slice(1)).entries(),
    );

    if (signature) {
      await store.set("signer-address", accountId);
      await store.set("signer-public-key", publicKey);
    }

    const signMessageOriginal = wallet.signMessage.bind(wallet);

    wallet.signMessage = async ({
      message,
      recipient,
    }: SignMessageParams): Promise<SignedMessage & { nonce?: Uint8Array }> => {
      if (error) return Promise.reject();

      const lastMessage = await store.get<string>("sign-last-message");
      const lastNonce = await store.get<Uint8Array>("sign-last-nonce");

      if (signature && message === lastMessage && lastNonce) {
        const nonce = Buffer.from(lastNonce);
        const callbackUrl = await store.get<string>("sign-last-url");

        return Promise.resolve({
          accountId: currentAddress,
          publicKey,
          signature,
          nonce,
          message,
          callbackUrl,
        } as SignedMessage);
      }

      const nonce = Buffer.from(new KwilNonce(32).clampUTF8);

      await store.set("sign-last-message", message);
      await store.set("sign-last-nonce", Array.from(nonce));

      signMessageOriginal({ message, nonce, recipient });

      return new Promise(() => ({}) as SignedMessage);
    };
  }

  const storedAddress = await store.get<string>("signer-address");

  let publicKey = await store.get<string>("signer-public-key");

  if (storedAddress !== currentAddress || !publicKey) {
    store.reset();
    // To avoid re-using the old signer's kgw cookie.
    // When kwil-js supports multi cookies, we can remove this.
    await kwilClient.client.auth.logoutKGW();

    const message = "idOS authentication";
    const nonce = Buffer.from(new KwilNonce(32).bytes);
    const signResult = await wallet.signMessage({ message, recipient, nonce });
    if (!signResult) throw new Error("signMessage returned no result");

    publicKey = signResult.publicKey;

    await store.set("signer-address", currentAddress);
    await store.set("signer-public-key", publicKey);
  }

  const signer = createNearWalletSigner(wallet, recipient);

  return {
    kwilSigner: new KwilSigner(signer, implicitAddressFromPublicKey(publicKey), "nep413"),
    publicKey,
  };
}
