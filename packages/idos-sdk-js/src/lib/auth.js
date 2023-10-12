import * as StableBase64 from "@stablelib/base64";
import * as StableBinary from "@stablelib/binary";
import * as StableBytes from "@stablelib/bytes";
import * as StableSha256 from "@stablelib/sha256";
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

      publicKey = await SigningKey.recoverPublicKey(
        hashMessage(message),
        await signer.signMessage(message),
      );

      this.idOS.store.set("signer-public-key", publicKey);
    }

    this.#setSigner({ signer, publicKey, signatureType: "secp256k1_ep" });
  }

  async setNearSigner(wallet, recipient="idos.network") {
    let publicKey = this.idOS.store.get("signer-public-key");

    if (!publicKey || !publicKey?.startsWith("ed25519")) {
      const message = "idOS authentication";
      const nonce = new this.idOS.crypto.Nonce(32);
      ({ publicKey } = await wallet.signMessage({ message, recipient, nonce }));
      this.idOS.store.set("signer-public-key", publicKey);
    }

    const signer = async message => {
      message = StableBase64.encode(message);

      const nonce = new this.idOS.crypto.Nonce(32);

      const { signature } = await wallet.signMessage({ message, recipient, nonce });

      const nep413BorshPayload = borsh.serialize(
        {
          struct: {
            tag: "u32",
            message: "string",
            nonce: { array: { type: "u8", len: 32 } },
            recipient: "string",
            callbackUrl: { option: "string" },
          },
        },
        { tag: 2147484061, message, nonce, recipient },
      );

      return StableBytes.concat(
        StableBinary.writeUint16BE(nep413BorshPayload.length),
        nep413BorshPayload,
        StableBase64.decode(signature),
      );
    };

    this.#setSigner({ signer, publicKey, signatureType: "nep413" });
  }

  async setEnclaveSigner() {
    if (window.location.hostname !== "localhost") {
      throw new Error("Enclave Signer only available for local development");
    }

    const signer = async (message) => (await this.idOS.crypto.sign(message));
    const publicKey = this.idOS.crypto.publicKeys.sig.raw;

    this.#setSigner({ signer, publicKey, signatureType: "ed25519" });
  }


  #setSigner() {
    this.idOS.kwilWrapper.setSigner(...arguments);
  }

  async currentUser() {
    if (!this._currentUser) {
      let humanId = this.idOS.store.get("human-id");

      if (!humanId) {
        humanId = await this.idOS.kwilWrapper.getHumanId();
        this.idOS.store.set("human-id", humanId);
      }

      this._currentUser = { humanId };
    }

    return this._currentUser;
  }
}
