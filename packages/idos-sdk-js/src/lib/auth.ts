import {
  base64Decode,
  binaryWriteUint16BE,
  borshSerialize,
  bytesConcat,
  utf8Decode,
} from "@idos-network/codecs";
import type { EthSigner } from "@kwilteam/kwil-js/dist/core/builders";
import type { SignMessageParams, SignedMessage, Wallet } from "@near-wallet-selector/core";
import type { Signer } from "ethers";

import type { Store } from "../../../idos-store";
import type { KwilWrapper } from "./kwil-wrapper";
import { Nonce } from "./nonce";
import { implicitAddressFromPublicKey } from "./utils";

export interface AuthUser {
  userId: string | null;
  userAddress: string;
  /**
   * The public key of the wallet that was used to sign the message.
   * It's only available when the `signer` is a NEAR wallet.
   */
  nearWalletPublicKey?: string;
  /**
   * The derived public key of the user from the password / passkey.
   */
  currentUserPublicKey?: string;
}

export class NoProfile extends Error {
  constructor() {
    super("Signer's address is not known to idOS.");
  }
}

export class Auth {
  private user?: AuthUser;

  get currentUser() {
    if (!this.user) throw new Error("Call idOS.setSigner first.");
    return this.user;
  }

  constructor(
    public readonly kwilWrapper: KwilWrapper,
    public readonly store: Store,
  ) {}

  forget() {
    this.store.reset();
  }

  remember(key: string, value: unknown) {
    this.store.set(key, value);
  }

  async setEvmSigner(signer: Signer) {
    const currentAddress = await signer.getAddress();

    if (!(await this.kwilWrapper.hasProfile(currentAddress))) throw new NoProfile();

    const storedAddress = this.store.get("signer-address");

    if (storedAddress !== currentAddress) {
      // To avoid re-using the old signer's kgw cookie.
      // When kwil-js supports multi cookies, we can remove this.
      await this.kwilWrapper.client.auth.logout();

      this.remember("signer-address", currentAddress);
    }

    this.kwilWrapper.setSigner({
      accountId: currentAddress,
      signer: signer as EthSigner,
      signatureType: "secp256k1_ep",
    });

    const { recipient_encryption_public_key, id } = await this.kwilWrapper.getUserProfile();

    this.user = {
      userId: id,
      currentUserPublicKey: recipient_encryption_public_key,
      userAddress: currentAddress,
    };
  }

  async setNearSigner(wallet: Wallet, recipient = "idos.network") {
    if (!wallet.signMessage) throw new Error("Only wallets with signMessage are supported.");

    const currentAddress = (await wallet.getAccounts())[0].accountId;

    if (!(await this.kwilWrapper.hasProfile(currentAddress))) throw new NoProfile();

    if (wallet.id === "my-near-wallet") {
      const { accountId, signature, publicKey, error } = Object.fromEntries(
        new URLSearchParams(window.location.hash.slice(1)).entries(),
      );

      if (signature) {
        this.remember("signer-address", accountId);
        this.remember("signer-public-key", publicKey);
      }

      const signMessageOriginal = wallet.signMessage.bind(wallet);

      wallet.signMessage = async ({
        message,
        recipient,
      }: SignMessageParams): Promise<SignedMessage & { nonce?: Uint8Array }> => {
        if (error) return Promise.reject();

        const lastMessage = this.store.get("sign-last-message");
        if (signature && message === lastMessage) {
          const nonce = Buffer.from(this.store.get("sign-last-nonce"));
          const callbackUrl = this.store.get("sign-last-url");

          return Promise.resolve({
            accountId: currentAddress,
            publicKey,
            signature,
            nonce,
            message,
            callbackUrl,
          } as SignedMessage);
        }
        const callbackUrl = window.location.href;
        const nonce = Buffer.from(new Nonce(32).clampUTF8);

        this.store.set("sign-last-message", message);
        this.store.set("sign-last-nonce", Array.from(nonce));
        this.store.set("sign-last-url", callbackUrl);

        signMessageOriginal({ message, nonce, recipient, callbackUrl });

        return new Promise(() => ({}) as SignedMessage);
      };
    }

    const storedAddress = this.store.get("signer-address");

    let publicKey = this.store.get("signer-public-key");

    if (storedAddress !== currentAddress || !publicKey) {
      this.forget();
      // To avoid re-using the old signer's kgw cookie.
      // When kwil-js supports multi cookies, we can remove this.
      await this.kwilWrapper.client.auth.logout();

      const message = "idOS authentication";
      const nonce = Buffer.from(new Nonce(32).bytes);
      // biome-ignore lint/style/noNonNullAssertion: Only non-signing wallets return void.
      ({ publicKey } = (await wallet.signMessage({ message, recipient, nonce }))!);

      this.remember("signer-address", currentAddress);
      this.remember("signer-public-key", publicKey);
    }

    const signer = async (message: string | Uint8Array): Promise<Uint8Array> => {
      // biome-ignore lint/style/noParameterAssign: we're narrowing the type on purpose.
      if (typeof message !== "string") message = utf8Decode(message);
      if (!wallet.signMessage) throw new Error("Only wallets with signMessage are supported.");

      const nonceSuggestion = Buffer.from(new Nonce(32).bytes);

      const {
        nonce = nonceSuggestion,
        signature,
        // @ts-ignore Signatures don't seem to be updated for NEP413 yet.
        callbackUrl,
        // biome-ignore lint/style/noNonNullAssertion: Only non-signing wallets return void.
      } = (await (
        wallet.signMessage as (
          _: SignMessageParams,
        ) => Promise<SignedMessage & { nonce?: Uint8Array }>
      )({
        message,
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
        message,
        nonce: Array.from(nonce),
        recipient,
        callbackUrl,
      };

      const nep413BorshPayload = borshSerialize(nep413BorschSchema, nep413BorshParams);

      return bytesConcat(
        binaryWriteUint16BE(nep413BorshPayload.length),
        nep413BorshPayload,
        base64Decode(signature),
      );
    };

    this.kwilWrapper.setSigner({
      accountId: implicitAddressFromPublicKey(publicKey),
      signer,
      signatureType: "nep413",
    });

    const { recipient_encryption_public_key, id } = await this.kwilWrapper.getUserProfile();

    this.user = {
      userId: id,
      currentUserPublicKey: recipient_encryption_public_key,
      userAddress: currentAddress,
      nearWalletPublicKey: publicKey,
    };
  }
}
