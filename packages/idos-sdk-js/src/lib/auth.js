import * as StableSha256 from "@stablelib/sha256";

export class Auth {
  constructor(idOS) {
    this.idOS = idOS;
  }

  async setEnclaveSigner() {
    await this.#setSigner(
      async (msg) => {
        const signature = await this.idOS.crypto.sign(msg);
        return signature;
      },
      this.idOS.crypto.publicKeys.sig.raw,
      "ed25519",
    );
  }

  async setWalletSigner(signer, publicKey, signatureType) {
    await this.#setSigner(signer, publicKey, signatureType);
  }

  async currentUser() {
    if (!this._currentUser) {
      const res = await this.idOS.kwilWrapper.call(
        "get_wallet_human_id",
        null,
        "See your idOS profile ID",
      );

      this._currentUser = {
        address: this.idOS.kwilWrapper.signer.address,
        humanId: res[0]?.human_id || null,
      };
    }

    return this._currentUser;
  }

  async #setSigner() {
    await this.idOS.kwilWrapper.setSigner(...arguments);
  }
}
