import { Store } from "../../../idos-store";
import { Auth } from "./auth";
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

  constructor({ nodeUrl, dbId, container }) {
    if (!this.constructor.initializing) {
      throw new Error("Usage: `idOS.init(options)`");
    }

    this.auth = new Auth(this);
    this.data = new Data(this);
    this.enclave = new Enclave(this, container);
    this.kwilWrapper = new KwilWrapper({ nodeUrl, dbId });
    this.grants = new Grants(this);
    this.store = new Store();
  }

  static async init({ nodeUrl, dbId, container }) {
    this.initializing = true;
    const idos = new this({ nodeUrl, dbId, container });
    await idos.enclave.load();

    return idos;
  }

  async setSigner(type, signer) {
    if (type === "NEAR") {
      const { accountId } = await this.auth.setNearSigner(signer);
      return this.grants.init({ type, accountId, signer });
    } else if (type === "EVM") {
      await this.auth.setEvmSigner(signer);
      return this.grants.init({ type, signer });
    } else {
      throw new Error("Signer type not recognized");
    }
  }

  async hasProfile(address) {
    return this.kwilWrapper.hasProfile(address);
  }

  async reset({ enclave = false } = {}) {
    await this.store.reset();
    if (enclave) await this.enclave.reset();
  }

  get nodeUrl() {
    return this.kwilWrapper.kwilProvider;
  }
}
