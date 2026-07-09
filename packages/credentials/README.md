# idOS Credentials JavaScript SDK

This library is helper for VerifiableCredentials in idOS.

**Warning:*** The `schema/` folder is the real "source of truth", it has been used to generate all of the schemas and builders! Never change `assets/*.json` or `generated/**` files!

## Types, names and other troubles.

We're now dealing with a several different types and names (who has versions). This package is trying hard to unify that across the whole codebase and whomever includes that.

### Naming

* *Kyc{VERSION}* - Credential subject for KYC data
* *FaceId{VERSION}* - Credentials subject for Face ID data
* *EnvelopeExtension{VERSION}* - Envelope extension of the main VC object (see below)
* All imports that ends up with *Latest* are pointed to the latest available version.

Every section below, contains the export you should use, if you want to use one of those:

### VerifiableCredential

This is the main W3C container data model https://www.w3.org/TR/vc-data-model-2.0/.

```typescript
export interface VerifiableCredential<K> {
  "@context": string[];
  type: string[];
  issuer: string;
  id: string;
  issued: string;
  expirationDate: string;
  credentialSubject: K;
  issuanceDate: string;
  proof: VerifiedCredentialsProof;
}
```

This is the main structure of what is encrypted and stored in idOS, also this is something which should be verified if the signature is matching.

```typescript
// Exports you should use
import type { VerifiableCredential } from "@idos-network/credentials/types";
```
### Schemas / Versioning

Since over time there can be a lot of contractions in the schemas, we need to version that. Also we don't support "just" KYC credentials but also FaceID credentials. And as any other we want just one source of truth, which is now `src/schemas`. It contains all the informations required for json-ld, flat schema or builders.

In this library is also a cli tool (`cli/generate-schemas.mjs`), to generate required `Json-LD XSD` schemas in the `assets/` folder and the matching full fat TypeScript definition for that.

```json
// JSON-LD: idos-credential-subject-v3.json
{
  "@context": {
    "@version": 1.1,
    "@protected": true,
    "xsd": "http://www.w3.org/2001/XMLSchema#",
    "personFirstName": "xsd:string",
    "personFamilyName": "xsd:string",
    ....
  }
}
```

Those schemas are passed and loaded via `loader` by URLs like:

```
https://idos-network.github.io/idos-sdk-js/credentials/idos-credentials-v1.json
```

Also they are used in `@context` as described in w3c spec.

### Builder types

Since sub-objects in JSON-LD are quite problematic, we went to having a one big fat flat Json for Credential Subject. `Json-LD` itself did not provide validations (not even presence), it just saying field + type. But this structure is bad to work with in code, as any Developer we ❤️ structures, that's why we came up with `Zod` objects, which are the **source of truth**.

Builder is for building the full-fat-credential Verifiable Credential object with all of those requirements.

```typescript
// Exports you should be using
import {
  buildLatestKycVC
} from "@idos-network/credentials/builder";

import type {
  KycSubjectLatestBuilderType,
  KycSubjectLatest,
  EnvelopeExtensionLatestBuilderType,
  AvailableIssuerType,
} from "@idos-network/credentials/types";

// Extension init
const fields: EnvelopeExtensionLatestBuilderType = {
  root: {
    kycLevel: 2,
    level: "basic+livenes",
  }
}

// Full KYC data
const subject: KycSubjectLatestBuilderType = {
  root: {
    id: crypto.randomUUID(),
  },
  person: {
    firstName: "John",
    familyName: "Doe",
  },
}

if (/* condition for proof of residency */) {
  subject.residentialAddress = {
    street: "Broadway",
    city: "New York",
    state: "NY",
  }
}

const issuer: AvailableIssuerType = {
  // one of the issuer 
}

// The build method is also available in idOS issuer since it's commonly used together
// issuer.buildLatestKycVC() with the same arguments
const vc: VerifiableCredential<KycSubjectLatest> = await buildLatestKycVC(
  fields,
  subject,
  issuer,
);

console.log(vc); // Verifiable credential with full flat KYC subject
```

### VerifiableCredential extensions

We also need fields like `level` or `kycLevel` to be present so we are extending the basic root object with this. The definition is the same as for `credentialSubject`.

### Parser types

## Generate a Ed25519VerificationKey2020

```javascript
import { Ed25519VerificationKey2020 } from "@digitalbazaar/ed25519-verification-key-2020";

const issuer = "https://my-issuer.id/";

const key = await Ed25519VerificationKey2020.generate({
  id: `${issuer}/keys/1`,
  controller: `${issuer}/issuers/1`,
});

/* Ed25519VerificationKey2020 {
  id: "https://my-issuer.id/keys/1",
  controller: "https://my-issuer.id/issuers/1",
  revoked: undefined,
  type: 'Ed25519VerificationKey2020',
  publicKeyMultibase: 'z6MkqozXNX5bbcs17yarKiwiZN1obZ3AR6evoubA2AyRnFnq',
  privateKeyMultibase: 'zrv1yczBBXSupDwutYPAoi1fyZLi1cZTPdXHaJXLiKX68E4u1jRy7Npc4dp65hAbKuwTws79MoiAJFDs4XKscz7Sjh3'
} */
```

## Issue a credentials

```javascript
import { buildCredential } from "@idos-network/credentials/builder";

const id = "z6MkszZtxCmA2Ce4vUV132PCuLQmwnaDD5mw2L23fGNnsiX3";

const data = await buildCredential(
  {
    id: `${issuer}/credentials/${id}`,
    level: "human",
    issued: new Date("2022-01-01"),
    approvedAt: new Date("2022-01-01"),
    expirationDate: new Date("2030-01-01"),
  },
  {
    id: `uuid:${id}`,
    applicantId: "1234567890",
    inquiryId: "1234567890",
    firstName: "John",
    familyName: "Lennon",
    governmentIdType: "SSN",
    governmentId: "123-45-6789",
    dateOfBirth: new Date("1980-01-01"),
    placeOfBirth: "New York, NY",
    idDocumentCountry: "US",
    idDocumentNumber: "123456789",
    idDocumentType: "PASSPORT",
    idDocumentDateOfIssue: new Date("2022-01-01"),
    idDocumentDateOfExpiry: new Date("2025-01-01"),
    idDocumentFrontFile: Buffer.from("Front of ID document"),
    idDocumentBackFile: Buffer.from("Back of ID document"),
    selfieFile: Buffer.from("Selfie"),
    residentialAddress: {
      street: "Main St",
      houseNumber: "123",
      additionalAddressInfo: "Apt 1",
      city: "New York",
      postalCode: "10001",
      country: "US",
    },
    residentialAddressProofCategory: "Utility Bill",
    residentialAddressProofDateOfIssue: new Date("2022-01-01"),
    residentialAddressProofFile: Buffer.from("Proof of address"),
  },
  key,
  true, // Validation against schema
);

console.log(data);
```

## Verify a credentials

```javascript
import { verifyCredential } from "@idos-network/credentials";

// We have a list of issuers we trust to
const allowedIssuers = [
  {
    issuer: "https://invalid-issuer.id/",
    publicKeyMultibase: "z6MkfjxfHddp5Pf1GGUSJQ3m6PEycX2DFTVFruUMZsHPXoJx",
  },
  // Ed25519VerificationKey2020 instance, or issuer information are available
  // You don't need a privateKeyMultibase for verification!
  key,
];

const [verified, resultsByIssuer] = await verifyCredential(credential, allowedIssuers);
console.log("Verified: ", verified);
console.log("Results by issuer: ", resultsByIssuer);
```

## Derive level

```javascript
import { deriveLevel } from "@idos-network/credentials/utils";

const level = deriveLevel({
  id: "uuid:1234",
  firstName: "John",
  familyName: "Doe",
  idDocumentType: "PASSPORT",
  dateOfBirth: new Date("1990-01-01"),
  idDocumentCountry: "US",
  idDocumentNumber: "123456789",
  idDocumentFrontFile: Buffer.from("ID Document Front"),
});

// level = "basic"
```

## Filtering and matching levels

```javascript
import {
  pickHighestMatchingLevel,
  matchLevelOrHigher,
  highestMatchingCredential,
} from "@idos-network/credentials/utils";

const matched = matchLevelOrHigher("basic", ["liveness"], "basic+liveness");
// matched = true

const matched = matchLevelOrHigher("basic", ["liveness+email"], "basic+liveness");
// matched = false

const matched = matchLevelOrHigher("basic", ["liveness+email"], "plus+liveness");
// matched = true

const pickedLevel = pickHighestMatchingLevel(
  ["basic+liveness", "plus+liveness+email", "plus+liveness+email+phoneNumber"],
  "plus",
  ["liveness", "email"],
);
// pickedLevel = plus+liveness+email+phoneNumber

const pickedCredential = highestMatchingCredential([...idOSCredentials], "basic", {
  addons: ["email", "liveness"],
  publicNotesConstraint: {
    status: "approved",
    type: "kyc",
  },
});
// pickedCredential => for example plus+email+liveness etc...
// don't forget to verify credentials signature before usage!
```
