import { EthSigner } from "@kwilteam/kwil-js/dist/core/builders";
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
  humanId?: string;
  address?: string;
  publicKey?: string;
}

export class Auth {
  idOS: idOS;
  user: AuthUser;

  constructor(idOS: idOS) {
    this.idOS = idOS;
    this.user = {};
  }

  async forget() {
    this.idOS.store.reset();
    await this.idOS.enclave.reset();
  }

  async remember(key: string, value: any) {
    this.idOS.store.set(key, value);
    await this.idOS.enclave.store(key, value);
  }

  async setEvmSigner(signer: Signer) {
    const currentAddress = await signer.getAddress();

    await this.remember("signer-address", currentAddress);

    const accountId = await signer.getAddress();

    return this.#setSigner({ signer, signatureType: "secp256k1_ep", accountId });
  }

  async setNearSigner(wallet: Wallet, recipient = "idos.network") {
    if (!wallet.signMessage) throw new Error("Only wallets with signMessage are supported.");

    const currentAddress = (await wallet.getAccounts())[0].accountId;

    if (wallet.id === "my-near-wallet") {
      const { accountId, signature, publicKey, error } = Object.fromEntries(
        new URLSearchParams(window.location.hash.slice(1)).entries()
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

      const message = "idOS authentication";
      const nonce = Buffer.from(new Nonce(32).bytes);
      ({ publicKey } = (await wallet.signMessage({ message, recipient, nonce }))!);

      await this.remember("signer-address", currentAddress);
      await this.remember("signer-public-key", publicKey);
    }

    const signer = async (message: string | Uint8Array): Promise<Uint8Array> => {
      if (typeof message !== "string") message = Utf8Codec.decode(message);
      if (!wallet.signMessage) throw new Error("Only wallets with signMessage are supported.");

      const nonceSuggestion = Buffer.from(new Nonce(32).bytes);

      const {
        nonce = nonceSuggestion,
        signature,
        // @ts-ignore Signatures don't seem to be updated for NEP413 yet.
        callbackUrl,
      } = (await (
        wallet.signMessage as (
          _: SignMessageParams
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
        Base64Codec.decode(signature)
      );
    };

    return this.#setSigner({
      accountId: implicitAddressFromPublicKey(publicKey),
      signer,
      signatureType: "nep413",
    });
  }

  #setSigner<
    T extends {
      accountId: string;
      signer: EthSigner | ((message: Uint8Array) => Promise<Uint8Array>);
      signatureType: string;
    },
  >(args: T) {
    this.idOS.kwilWrapper.setSigner(args);

    return args;
  }

  async setHumanId(humanId: string) {
    if (!humanId) return;

    this.user.humanId = humanId;
    await this.remember("human-id", humanId);
  }

  async currentUser() {
    if (this.user.humanId === undefined) {
      const currentUserKeys = ["human-id", "signer-address", "signer-public-key"];
      let [humanId, address, publicKey] = currentUserKeys.map(
        this.idOS.store.get.bind(this.idOS.store)
      ) as Array<string | undefined>;

      humanId = humanId || (await this.idOS.kwilWrapper.getHumanId()) || undefined;

      this.user = { humanId, address, publicKey };
      this.idOS.store.set("human-id", humanId);
    }

    return this.user;
  }
}
