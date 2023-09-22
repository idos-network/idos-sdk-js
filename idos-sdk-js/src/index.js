import { Auth } from "./auth";
import { KwilWrapper } from "./kwil-wrapper";
import { Crypto } from "./crypto";
import { Data } from "./data";

export class idOS {
  constructor(options) {
    this.kwilWrapper = new KwilWrapper({ url: options.url });

    this.container = options.container;

    this.auth = new Auth(this);
    this.crypto = new Crypto(this);
    this.data = new Data(this);
  }
}
