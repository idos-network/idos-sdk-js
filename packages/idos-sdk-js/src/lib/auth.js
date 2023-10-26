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
  }

  async setNearSigner(wallet, recipient = "idos.network") {
    if (wallet.id === "my-near-wallet") {
      wallet.signMessageOriginal = wallet.signMessage.bind(wallet);
      wallet.signMessage = async ({ message, recipient, nonce }) => {
        let paramsSinature = window.location.hash.match(/signature=(.*?)&/);
        let paramsPublicKey = window.location.hash.match(/publicKey=(.*?)&/);

        if (paramsSinature && message === this.idOS.store.get("sign-last-message")) {
          const publicKey = decodeURIComponent(paramsPublicKey[1]);
          const signature = decodeURIComponent(paramsSinature[1]);

          return Promise.resolve({
            publicKey,
            signature,
            lastNonce: JSON.parse(this.idOS.store.get("sign-last-nonce")).data,
            lastMessage: this.idOS.store.get("sign-last-message"),
            lastUrl: this.idOS.store.get("sign-last-url"),
          });
        } else {
          const callbackUrl = window.location.href;

          this.idOS.store.set("sign-last-message", message);
          this.idOS.store.set("sign-last-nonce", JSON.stringify(nonce));
          this.idOS.store.set("sign-last-url", callbackUrl);

          wallet.signMessageOriginal({ callbackUrl, message, nonce, recipient });

          await new Promise((_) => (_));
        }
      };
    }

    let publicKey = this.idOS.store.get("signer-public-key");

    if (!publicKey || !publicKey?.startsWith("ed25519")) {
      let message = "idOS authentication";
      let nonce = this.idOS.crypto.Nonce.trimmedUUID();
      ({ publicKey } = await wallet.signMessage({ message, recipient, nonce: Buffer.from(nonce) }));

      this.idOS.store.set("signer-public-key", publicKey);
    }

    this.idOS.store.set("signer-address", (await wallet.getAccounts())[0].accountId);

    const signer = async (message) => {
      message = StableBase64.encode(message);
      //let nonce = this.idOS.crypto.Nonce.trimmedUUID();
      let nonce = this.idOS.crypto.Nonce.fill(1);

      const { lastNonce, signature, lastUrl } = await wallet.signMessage({ message, recipient, nonce: Buffer.from(nonce) });

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
        nonce: Array.from(lastNonce || nonce),
        recipient,
      };

      if (lastUrl) {
        nep413BorshParams.callbackUrl = lastUrl;
      }

      const nep413BorshPayload = borsh.serialize(
        nep413BorschSchema,
        nep413BorshParams,
      );

      return StableBytes.concat(
        StableBinary.writeUint16BE(nep413BorshPayload.length),
        nep413BorshPayload,
        StableBase64.decode(signature)
      );
    };

    this.#setSigner({ signer, publicKey, signatureType: "nep413" });
  }

  async setEnclaveSigner() {
    if (window.location.hostname !== "localhost") {
      throw new Error("Enclave Signer only available for local development");
    }

    const signer = async (message) => await this.idOS.crypto.sign(message);
    const publicKey = this.idOS.crypto.publicKeys.sig.raw;
    this.#setSigner({ signer, publicKey, signatureType: "ed25519" });
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
      };
    }
    return this._currentUser;
  }
}
