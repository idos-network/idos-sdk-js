export class Auth {
  constructor(idOS) {
    this.idOS = idOS;
  }

  async setWeb3Signer(signer) {
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
