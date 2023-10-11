import { Auth } from "./auth";
import { Crypto } from "./crypto";
import { Data } from "./data";
import { Grants } from "./grants/grants";
import { KwilWrapper } from "./kwil-wrapper";
import { Utils } from "./utils";

export class idOS {
  constructor(options) {
    this.kwilWrapper = new KwilWrapper({ url: options.url });
    this.container = options.container;

    this.crypto = new Crypto(this);
    this.auth = new Auth(this);
    this.data = new Data(this);
    this.grants = new Grants(this);
    this.utils = Utils;

    this.crypto.loadProvider().then(this);
  }
}
