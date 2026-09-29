import { IsDefined, IsOptional, IsString } from "class-validator";

import { Section } from "../utils";
import { Biometric } from "./Biometric";
import { Contact } from "./Contact";
import { EDD, type EDDFields } from "./EDD";
import { IdDocument, type IdDocumentFields } from "./IdDocument";
import { Onboarding } from "./Onboarding";
import { Person, type PersonFields } from "./Person";
import { ResidentialAddress, type ResidentialAddressFields } from "./ResidentialAddress";
import { Screening } from "./Screening";
import { SourceOfWealth, type SourceOfWealthFields } from "./SourceOfWealth";

/** The credential subject: the sections that get flattened onto the wire. */
export class Subject {
  @IsString()
  id: string;

  @Section(() => Person)
  @IsDefined()
  person: PersonFields;

  @Section(() => IdDocument)
  @IsOptional()
  idDocument?: IdDocumentFields;

  @Section(() => Contact)
  @IsOptional()
  contact?: Contact;

  @Section(() => Biometric)
  @IsOptional()
  biometric?: Biometric;

  @Section(() => ResidentialAddress)
  @IsOptional()
  residentialAddress?: ResidentialAddressFields;

  @Section(() => Screening)
  @IsOptional()
  screening?: Screening;

  @Section(() => EDD)
  @IsOptional()
  edd?: EDDFields;

  @Section(() => SourceOfWealth)
  @IsOptional()
  sourceOfWealth?: SourceOfWealthFields;

  @Section(() => Onboarding)
  @IsOptional()
  onboarding?: Onboarding;
}
