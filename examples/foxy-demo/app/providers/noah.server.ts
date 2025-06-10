import type { Credentials } from "@idos-network/consumer";

export interface NoahCustomer {
  Type: "Individual";
  FullName: FullName;
  DateOfBirth: string;
  Email: string;
  PhoneNumber: string;
  Identities: Identity[];
  PrimaryResidence: PrimaryResidence;
}

export interface FullName {
  FirstName: string;
  LastName: string;
  MiddleName: string;
}

export interface Identity {
  IssuingCountry: string;
  IDNumber: string;
  IssuedDate: string;
  ExpiryDate: string;
  IDType: string;
}

export interface PrimaryResidence {
  Street: string;
  Street2?: string;
  City: string;
  PostCode: string;
  State?: string;
  Country: string;
}

export async function createNoahCustomer(credentials: Credentials) {
  const cs = credentials.credentialSubject;

  const subject: NoahCustomer = {
    Type: "Individual",
    FullName: {
      FirstName: cs.firstName,
      LastName: cs.familyName,
      MiddleName: cs.middleName,
    },
    DateOfBirth: cs.dateOfBirth,
    // TODO: Email
    Email: "email@example.com",
    // TODO: Phone number
    PhoneNumber: "1234567890",
    Identities: [
      {
        IssuingCountry: cs.idDocumentCountry,
        IDNumber: cs.idDocumentNumber,
        IssuedDate: cs.idDocumentDateOfIssue,
        ExpiryDate: cs.idDocumentDateOfExpiry,
        IDType: cs.idDocumentType,
      },
    ],
    PrimaryResidence: {
      Street: cs.residentialAddressStreet,
      City: cs.residentialAddressCity,
      PostCode: cs.residentialAddressPostalCode,
      State: cs.residentialAddressState,
      Country: cs.residentialAddressCountry,
    },
  };

  return subject;
}
