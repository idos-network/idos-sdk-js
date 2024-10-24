import type { idOSWallet } from "@idos-network/idos-sdk-types";
import type { Enclave } from "../enclave";
import type { KwilWrapper } from "../kwil-wrapper";
import { DataLayer } from "./datalayer";

export class WalletDataLayer extends DataLayer<idOSWallet> {
  constructor(
    public readonly enclave: Enclave,
    public readonly kwilWrapper: KwilWrapper,
  ) {
    super(kwilWrapper, "wallets");
  }
}
