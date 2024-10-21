import type { idOSHumanAttribute } from "@idos-network/idos-sdk-types";
import type { Enclave } from "../enclave";
import type { KwilWrapper } from "../kwil-wrapper";
import { DataLayer } from "./datalayer";

export class AttributeDataLayer extends DataLayer<idOSHumanAttribute> {
  constructor(
    public readonly enclave: Enclave,
    public readonly kwilWrapper: KwilWrapper,
  ) {
    super(kwilWrapper, "attributes");
  }
}
