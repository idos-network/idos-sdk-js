import * as StableSha256 from "@stablelib/sha256";

export class Auth {
  constructor(idOS) {
    this.idOS = idOS;
  }

  async setEnclaveSigner() {
    await this.idOS.kwilWrapper.setSigner(
      {
        signMessage: async (msg) => (
          { signature: await this.idOS.crypto.sign(StableSha256.hash(msg)) }
        ),
      },
      this.idOS.crypto.publicKeys.sig.raw,
    );
  }

  async setWalletSigner(signer) {
    await this.idOS.kwilWrapper.setSigner(signer);
  }

  async currentUser() {
    if (!this._currentUser) {
      const res = await this.idOS.kwilWrapper.call("get_wallet_human_id");

      this._currentUser = {
        address: this.idOS.kwilWrapper.signer.address,
        humanId: res[0]?.human_id || null,
      };
    }

    return this._currentUser;
  }
}
