import type { CredentialSubjectV2 } from "../../../generated/CredentialSubjectV2";
import type { StructuredObject as CredentialSubjectType } from "./schema";

import { VerifiableCredentialContainerBase } from "../..";
import {
  StructuredSchema as EnvelopeSchema,
  type StructuredObject as EnvelopeType,
} from "../../envelope/v2/schema";
import { IdDocumentSchema } from "./idDocument";
import { ResidentialAddressSchema } from "./residentialAddress";
import { RootSchema } from "./root";
import { CONTEXT_IDOS_CREDENTIAL_V1, CONTEXT_IDOS_CREDENTIAL_V2_SUBJECT } from "../../../utils/loader";

export class VerifiableCredentialKycV2 extends VerifiableCredentialContainerBase<
  EnvelopeType,
  CredentialSubjectType,
  CredentialSubjectV2
> {
  constructor() {
    super(CONTEXT_IDOS_CREDENTIAL_V1, CONTEXT_IDOS_CREDENTIAL_V2_SUBJECT);
  }

  checkValidity(): void {
    EnvelopeSchema.parse(this.envelope);
    RootSchema.parse(this.subject.root);

    if (this.subject.idDocument) {
      IdDocumentSchema.parse(this.subject.idDocument);
    }

    if (this.subject.residentialAddress) {
      ResidentialAddressSchema.parse(this.subject.residentialAddress);
    }
  }

  setMandatoryEnvelopeFields(fields: EnvelopeType): void {
    EnvelopeSchema.parse(fields);
    this.envelope = fields;
  }

  setMandatoryFields(root: CredentialSubjectType["root"]): void {
    RootSchema.parse(root);
    this.subject.root = root;
  }

  addIdDocument(idDocument: CredentialSubjectType["idDocument"], validate: boolean = true): void {
    if (validate) {
      IdDocumentSchema.parse(idDocument);
    }

    this.subject.idDocument = idDocument;
  }

  addResidentialAddress(
    residentialAddress: CredentialSubjectType["residentialAddress"],
    validate: boolean = true,
  ): void {
    if (validate) {
      ResidentialAddressSchema.parse(residentialAddress);
    }

    this.subject.residentialAddress = residentialAddress;
  }
}
