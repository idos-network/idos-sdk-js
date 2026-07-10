import type { CredentialSubjectV3 } from "../../../generated/CredentialSubjectV3";
import type { StructuredObject as CredentialSubjectType } from "./schema";

import { VerifiableCredentialContainerBase } from "../..";
import {
  StructuredSchema as EnvelopeSchema,
  type StructuredObject as EnvelopeType,
} from "../../envelope/v2/schema";
import { BiometricSchema } from "./biometric";
import { ContactSchema } from "./contact";
import { EDDSchema } from "./edd";
import { IdDocumentSchema } from "./idDocument";
import { PersonSchema } from "./person";
import { ResidentialAddressSchema } from "./residentialAddress";
import { RootSchema } from "./root";
import { ScreeningSchema } from "./screening";
import { SourceOfWealthSchema } from "./sourceOfWealth";
import { CONTEXT_IDOS_CREDENTIAL_V2, CONTEXT_IDOS_CREDENTIAL_V3_SUBJECT } from "../../../utils/loader";

export class VerifiableCredentialKycV3 extends VerifiableCredentialContainerBase<
  EnvelopeType,
  CredentialSubjectType,
  CredentialSubjectV3
> {
  constructor() {
    super(CONTEXT_IDOS_CREDENTIAL_V2, CONTEXT_IDOS_CREDENTIAL_V3_SUBJECT);
  }

  checkValidity(): void {
    EnvelopeSchema.parse(this.envelope);
    RootSchema.parse(this.subject.root);
    PersonSchema.parse(this.subject.person);
    IdDocumentSchema.parse(this.subject.idDocument);

    if (this.subject.contact) {
      ContactSchema.parse(this.subject.contact);
    }

    if (this.subject.biometric) {
      BiometricSchema.parse(this.subject.biometric);
    }

    if (this.subject.residentialAddress) {
      ResidentialAddressSchema.parse(this.subject.residentialAddress);
    }

    if (this.subject.screening) {
      ScreeningSchema.parse(this.subject.screening);
    }

    if (this.subject.edd) {
      EDDSchema.parse(this.subject.edd);
    }

    if (this.subject.sourceOfWealth) {
      SourceOfWealthSchema.parse(this.subject.sourceOfWealth);
    }
  }

  setMandatoryEnvelopeFields(fields: EnvelopeType): void {
    EnvelopeSchema.parse(fields);
    this.envelope = fields;
  }

  setMandatoryFields(
    root: CredentialSubjectType["root"],
    person: CredentialSubjectType["person"],
    idDocument: CredentialSubjectType["idDocument"],
  ): void {
    RootSchema.parse(root);
    PersonSchema.parse(person);
    IdDocumentSchema.parse(idDocument);

    this.subject.root = root;
    this.subject.person = person;
    this.subject.idDocument = idDocument;
  }

  addContact(contact: CredentialSubjectType["contact"], validate: boolean = true): void {
    if (validate) {
      ContactSchema.parse(contact);
    }

    this.subject.contact = contact;
  }

  addBiometric(biometric: CredentialSubjectType["biometric"], validate: boolean = true): void {
    if (validate) {
      BiometricSchema.parse(biometric);
    }

    this.subject.biometric = biometric;
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

  addScreening(screening: CredentialSubjectType["screening"], validate: boolean = true): void {
    if (validate) {
      ScreeningSchema.parse(screening);
    }

    this.subject.screening = screening;
  }

  addEDD(edd: CredentialSubjectType["edd"], validate: boolean = true): void {
    if (validate) {
      EDDSchema.parse(edd);
    }

    this.subject.edd = edd;
  }

  addSourceOfWealth(
    sourceOfWealth: CredentialSubjectType["sourceOfWealth"],
    validate: boolean = true,
  ): void {
    if (validate) {
      SourceOfWealthSchema.parse(sourceOfWealth);
    }

    this.subject.sourceOfWealth = sourceOfWealth;
  }
}
