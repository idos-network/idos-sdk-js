import { WebKwil } from "@kwilteam/kwil-js";

export const kwilProvider = "kwil-provider";
export const chainId = "chain-id";

export class TestKwilClient extends WebKwil {
  constructor() {
    super({ kwilProvider, chainId });
  }
}
