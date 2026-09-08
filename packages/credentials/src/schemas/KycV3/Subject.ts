import { IsDefined, IsOptional, IsString } from "class-validator";

import { Section } from "../utils";
import { Biometric } from "./Biometric";
import { Contact } from "./Contact";
import { EDD } from "./EDD";
import { IdDocument } from "./IdDocument";
import { Onboarding } from "./Onboarding";
import { Person } from "./Person";
import { ResidentialAddress } from "./ResidentialAddress";
import { Screening } from "./Screening";
import { SourceOfWealth } from "./SourceOfWealth";

/** The credential subject: the sections that get flattened onto the wire. */
export class Subject {
  @IsString()
  id: string;

  @Section(() => Person)
  @IsDefined()
  person: Person;

  @Section(() => IdDocument)
  @IsOptional()
  idDocument?: IdDocument;

  @Section(() => Contact)
  @IsOptional()
  contact?: Contact;

  @Section(() => Biometric)
  @IsOptional()
  biometric?: Biometric;

  @Section(() => ResidentialAddress)
  @IsOptional()
  residentialAddress?: ResidentialAddress;

  @Section(() => Screening)
  @IsOptional()
  screening?: Screening;

  @Section(() => EDD)
  @IsOptional()
  edd?: EDD;

  @Section(() => SourceOfWealth)
  @IsOptional()
  sourceOfWealth?: SourceOfWealth;

  @Section(() => Onboarding)
  @IsOptional()
  onboarding?: Onboarding;
}
