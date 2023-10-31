import * as StableBase64 from "@stablelib/base64";
import * as StableBinary from "@stablelib/binary";
import * as StableBytes from "@stablelib/bytes";
import * as borsh from "borsh";
import { SigningKey, hashMessage } from "ethers";

export class Auth {
  constructor(idOS) {
    this.idOS = idOS;
  }

  async setEvmSigner(signer) {
    let publicKey = this.idOS.store.get("signer-public-key");

    if (!publicKey || publicKey.startsWith("ed25519")) {
      const message = "idOS authentication";
      publicKey = SigningKey.recoverPublicKey(hashMessage(message), await signer.signMessage(message));
      this.idOS.store.set("signer-public-key", publicKey);
      this.idOS.store.set("signer-address", signer.address);
    }

    this.#setSigner({ signer, publicKey, signatureType: "secp256k1_ep" });

    await this.idOS.crypto.init();
    await this.idOS.grants.init({ signer, type: "evm" });

    return await this.currentUser();
  }

  async setNearSigner(wallet, recipient = "idos.network") {
    if (wallet.id === "my-near-wallet") {
      wallet.signMessageOriginal = wallet.signMessage.bind(wallet);
      wallet.signMessage = async ({ message, recipient, nonce }) => {

        const { signature, publicKey, error } =
          [...window.location.hash.matchAll(/(?<k>.*?)=(?<v>.*?)&/g)]
            .map(m => m.groups)
           .reduce((result, { k, v }) => Object.assign(result, { [k]: decodeURIComponent(v) }), {});

        if (error) return Promise.reject();

        const lastMessage = this.idOS.store.get("sign-last-message", { json: true });
        if (signature && message === lastMessage) {
          const nonce = Buffer.from(this.idOS.store.get("sign-last-nonce", { json: true }));
          const callbackUrl = this.idOS.store.get("sign-last-url");

          return Promise.resolve({
            publicKey,
            signature,
            nonce,
            message,
            callbackUrl,
          });
        } else {
          const callbackUrl = window.location.href;

          this.idOS.store.set("sign-last-message", message, { json: true });
          this.idOS.store.set("sign-last-nonce", Array.from(nonce), { json: true });
          this.idOS.store.set("sign-last-url", callbackUrl);

          wallet.signMessageOriginal({ message, nonce, recipient, callbackUrl });

          await new Promise(() => {});
        }
      };
    }

    let publicKey = this.idOS.store.get("signer-public-key");

    if (!publicKey || !publicKey?.startsWith("ed25519")) {
      const message = "idOS authentication";
      const nonce = Buffer.from(this.idOS.crypto.Nonce.trimmedUUID());
      ({ publicKey } = await wallet.signMessage({ message, recipient, nonce }));

      this.idOS.store.set("signer-public-key", publicKey);
    }

    const accountId = (await wallet.getAccounts())[0].accountId;
    this.idOS.store.set("signer-address", accountId);

    const signer = async (message) => {
      message = StableBase64.encode(message);
      //message = new TextDecoder().decode(message);

      const uuidNonce = this.idOS.crypto.Nonce.trimmedUUID();
      const {
        nonce = uuidNonce,
        signature,
        callbackUrl,
      } = await wallet.signMessage({
        message,
        recipient,
        nonce: Buffer.from(uuidNonce),
      });

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

      const nep413BorshPayload = borsh.serialize(
        nep413BorschSchema,
        nep413BorshParams,
      );

      return StableBytes.concat(
        StableBinary.writeUint16BE(nep413BorshPayload.length),
        nep413BorshPayload,
        StableBase64.decode(signature),
      );
    };

    this.#setSigner({ signer, publicKey, signatureType: "nep413" });

    await this.idOS.crypto.init();
    await this.idOS.grants.init({ type: "near", accountId, wallet });

    return await this.currentUser();
  }

  #setSigner(...args) {
    this.idOS.kwilWrapper.setSigner(...args);
  }

  async currentUser() {
    if (!this._currentUser) {
      let humanId = this.idOS.store.get("human-id");

      if (!humanId) {
        humanId = await this.idOS.kwilWrapper.getHumanId();
        this.idOS.store.set("human-id", humanId);
      }
      this._currentUser = {
        humanId,
        address: this.idOS.store.get("signer-address"),
        publicKey: this.idOS.store.get("signer-public-key"),
      };
    }
    return this._currentUser;
  }
}
