import { IsEmail, IsOptional, IsString } from "class-validator";

export class Contact {
  /* The person's email address. */
  @IsOptional()
  @IsEmail()
  email?: string;

  /* The person's phone number. */
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}
