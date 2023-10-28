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

  static verifiableCredentials = verifiableCredentials;

  constructor({ nodeUrl, container }) {
    if (!this.constructor.initializing) {
      throw new Error("Usage: `idOS.init(options)`");
    }

    this.nodeUrl = nodeUrl;

    this.auth = new Auth(this);
    this.crypto = new Crypto(this);
    this.data = new Data(this);
    this.enclave = new Enclave(this, container);
    this.kwilWrapper = new KwilWrapper({ nodeUrl });
    this.grants = new Grants(this);
    this.store = new Store({
      initWith: ["human-id", "signer-public-key"],
    });
  }

  static async init({ nodeUrl = import.meta.env.VITE_IDOS_NODE_URL, container }) {
    this.initializing = true;
    const idos = new this({ nodeUrl, container });
    await idos.enclave.loadProvider();

    return idos;
  }

  async setSigner(type, signer) {
    if (type === "NEAR") {
      await this.auth.setNearSigner(signer);
    } else if (type === "EVM") {
      await this.auth.setEvmSigner(signer);
    } else {
      throw("Signer type not recognized");
    }
  }

  async reset(keep = {}) {
    await this.store.reset(keep);
    await this.enclave.reset(keep);
  }
}
