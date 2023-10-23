import { Store } from "../../../idos-store";
import { Auth } from "./auth";
import { Crypto } from "./crypto";
import { Data } from "./data";
import { Enclave } from "./enclave";
import { Grants } from "./grants/grants";
import { KwilWrapper } from "./kwil-wrapper";
import { Utils } from "./utils";

export class idOS {
  static initializing = false;

  constructor({ nodeUrl, container }) {
    if (!this.constructor.initializing) {
      throw new Error("Usage: `idOS.init(options)`");
    }
    this.auth = new Auth(this);
    this.crypto = new Crypto(this);
    this.data = new Data(this);
    this.enclave = new Enclave(this, container);
    this.kwilWrapper = new KwilWrapper({ nodeUrl });
    this.grants = new Grants(this);
    this.store = new Store({
      initWith: ["human-id", "signer-public-key"],
    });
    this.utils = Utils;
  }

  static async init({ nodeUrl, container }) {
    this.initializing = true;
    const idos = new this({ nodeUrl, container });
    await idos.enclave.loadProvider();
    return idos;
  }

  async reset() {
    await this.store.reset();
    await this.enclave.reset();
  }
}
