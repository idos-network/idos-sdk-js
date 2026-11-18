import { IsEmail, IsEnum, IsOptional, IsString, ValidateIf } from "class-validator";

import { ContactSources, type ContactSource } from "../enums";

export class Contact {
  /* The person's email address. */
  @IsOptional()
  @IsEmail()
  email?: string;

  /* How the email was obtained: typed in (MANUAL) or verified. A MANUAL email does not count towards the level. */
  // Unlike @IsOptional(), lets only an omitted source through: a null one would count as verified.
  @ValidateIf((_, value) => value !== undefined)
  @IsEnum(ContactSources)
  emailSource?: ContactSource;

  /* The person's phone number. */
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  /* How the phone number was obtained: typed in (MANUAL) or verified. A MANUAL phone number does not count towards the level. */
  // Unlike @IsOptional(), lets only an omitted source through: a null one would count as verified.
  @ValidateIf((_, value) => value !== undefined)
  @IsEnum(ContactSources)
  phoneNumberSource?: ContactSource;
}
