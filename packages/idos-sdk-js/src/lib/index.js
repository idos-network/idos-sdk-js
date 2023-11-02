import { Store } from "../../../idos-store";
import { Auth } from "./auth";
import { Crypto } from "./crypto";
import { Data } from "./data";
import { Enclave } from "./enclave";
import { Grants } from "./grants/grants";
import { KwilWrapper } from "./kwil-wrapper";
import verifiableCredentials from "./verifiable-credentials";

export class idOS {
  static initializing = false;

  static near = Grants.near;
  static profileProviders = [import.meta.env.VITE_FRACTAL_ID_URL];

  static verifiableCredentials = verifiableCredentials;

  constructor({ kwilProvider, container }) {
    if (!this.constructor.initializing) {
      throw new Error("Usage: `idOS.init(options)`");
    }

    this.auth = new Auth(this);
    this.crypto = new Crypto(this);
    this.data = new Data(this);
    this.enclave = new Enclave(this, container);
    this.kwilWrapper = new KwilWrapper({ kwilProvider });
    this.grants = new Grants(this);
    this.store = new Store();
  }

  static async init({ nodeUrl, container }) {
    this.initializing = true;
    const idos = new this({ kwilProvider: nodeUrl, container });
    await idos.enclave.loadProvider();

    return idos;
  }

  async setSigner(type, signer) {
    if (type === "NEAR") {
      const { accountId } = await this.auth.setNearSigner(signer);
      await this.grants.init({ type, accountId, signer });
    } else if (type === "EVM") {
      await this.auth.setEvmSigner(signer);
      await this.grants.init({ type, signer });
    } else {
      throw("Signer type not recognized");
    }

    await this.crypto.init();
    return this.auth.currentUser();
  }

  async reset({ enclave = false } = {}) {
    await this.store.reset();
    if (enclave) await this.enclave.reset();
  }

  get nodeUrl() {
    return this.kwilWrapper.kwilProvider;
  }
}
