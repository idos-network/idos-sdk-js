import { IsEmail, IsEnum, IsOptional, IsString } from "class-validator";

import { ContactSources, type ContactSource } from "../enums";

export class Contact {
  /* The person's email address. */
  @IsOptional()
  @IsEmail()
  email?: string;

  /* How the email was obtained: typed in (MANUAL) or verified. A MANUAL email does not count towards the level. */
  @IsOptional()
  @IsEnum(ContactSources)
  emailSource?: ContactSource;

  /* The person's phone number. */
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  /* How the phone number was obtained: typed in (MANUAL) or verified. A MANUAL phone number does not count towards the level. */
  @IsOptional()
  @IsEnum(ContactSources)
  phoneNumberSource?: ContactSource;
}
