import type { SignMessageParams, SignedMessage, Wallet } from "@near-wallet-selector/core";
import * as Base64Codec from "@stablelib/base64";
import * as BinaryCodec from "@stablelib/binary";
import * as BytesCodec from "@stablelib/bytes";
import * as Utf8Codec from "@stablelib/utf8";
import * as BorshCodec from "borsh";
import type { Signer } from "ethers";

import { idOS } from "./idos";
import { Nonce } from "./nonce";
import { implicitAddressFromPublicKey } from "./utils";

/* global Buffer */

export interface AuthUser {
  humanId: string | null;
  address: string;
  publicKey?: string;
}

export class Auth {
  idOS: idOS;
  user?: AuthUser;

  constructor(idOS: idOS) {
    this.idOS = idOS;
  }

  async forget() {
    this.idOS.store.reset();
  }

  async remember(key: string, value: any) {
    this.idOS.store.set(key, value);
  }

  async setEvmSigner(signer: Signer) {
    const currentAddress = await signer.getAddress();

    const storedAddress = this.idOS.store.get("signer-address");

    if (storedAddress !== currentAddress) {
      // To avoid re-using the old signer's kgw cookie.
      // When kwil-js supports multi cookies, we can remove this.
      await this.idOS.kwilWrapper.client.auth.logout();

      await this.remember("signer-address", currentAddress);
    }

    this.idOS.kwilWrapper.setSigner({
      accountId: currentAddress,
      signer,
      signatureType: "secp256k1_ep",
    });

    this.user = {
      humanId: await this.idOS.kwilWrapper.getHumanId(),
      address: currentAddress,
    };
  }

  async setNearSigner(wallet: Wallet, recipient = "idos.network") {
    if (!wallet.signMessage) throw new Error("Only wallets with signMessage are supported.");

    const currentAddress = (await wallet.getAccounts())[0].accountId;

    if (wallet.id === "my-near-wallet") {
      const { accountId, signature, publicKey, error } = Object.fromEntries(
        new URLSearchParams(window.location.hash.slice(1)).entries(),
      );

      if (signature) {
        await this.remember("signer-address", accountId);
        await this.remember("signer-public-key", publicKey);
      }

      const signMessageOriginal = wallet.signMessage.bind(wallet);

      wallet.signMessage = async ({
        message,
        recipient,
      }: SignMessageParams): Promise<SignedMessage & { nonce?: Uint8Array }> => {
        if (error) return Promise.reject();

        const lastMessage = this.idOS.store.get("sign-last-message");
        if (signature && message === lastMessage) {
          const nonce = Buffer.from(this.idOS.store.get("sign-last-nonce"));
          const callbackUrl = this.idOS.store.get("sign-last-url");

          return Promise.resolve({
            accountId: currentAddress,
            publicKey,
            signature,
            nonce,
            message,
            callbackUrl,
          });
        }
        const callbackUrl = window.location.href;
        const nonce = Buffer.from(new Nonce(32).clampUTF8);

        this.idOS.store.set("sign-last-message", message);
        this.idOS.store.set("sign-last-nonce", Array.from(nonce));
        this.idOS.store.set("sign-last-url", callbackUrl);

        signMessageOriginal({ message, nonce, recipient, callbackUrl });

        return new Promise(() => ({}) as SignedMessage);
      };
    }

    const storedAddress = this.idOS.store.get("signer-address");

    let publicKey = this.idOS.store.get("signer-public-key");

    if (storedAddress !== currentAddress || !publicKey) {
      await this.forget();
      // To avoid re-using the old signer's kgw cookie.
      // When kwil-js supports multi cookies, we can remove this.
      await this.idOS.kwilWrapper.client.auth.logout();

      const message = "idOS authentication";
      const nonce = Buffer.from(new Nonce(32).bytes);
      // biome-ignore lint/style/noNonNullAssertion: Only non-signing wallets return void.
      ({ publicKey } = (await wallet.signMessage({ message, recipient, nonce }))!);

      await this.remember("signer-address", currentAddress);
      await this.remember("signer-public-key", publicKey);
    }

    const signer = async (message: string | Uint8Array): Promise<Uint8Array> => {
      // biome-ignore lint/style/noParameterAssign: we're narrowing the type on purpose.
      if (typeof message !== "string") message = Utf8Codec.decode(message);
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

      const nep413BorshPayload = BorshCodec.serialize(nep413BorschSchema, nep413BorshParams);

      return BytesCodec.concat(
        BinaryCodec.writeUint16BE(nep413BorshPayload.length),
        nep413BorshPayload,
        Base64Codec.decode(signature),
      );
    };

    this.idOS.kwilWrapper.setSigner({
      accountId: implicitAddressFromPublicKey(publicKey),
      signer,
      signatureType: "nep413",
    });

    this.user = {
      humanId: await this.idOS.kwilWrapper.getHumanId(),
      address: currentAddress,
      publicKey,
    };
  }

  async currentUser() {
    if (!this.user) throw new Error("Call idOS.setSigner first.");

    return this.user;
  }
}
