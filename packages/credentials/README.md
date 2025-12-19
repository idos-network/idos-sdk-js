# idOS Credentials JavaScript SDK

This library is helper for VerifiableCredentials in idOS.

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
const allowedIssuers = [{
    issuer: "https://invalid-issuer.id/",
    publicKeyMultibase: "z6MkfjxfHddp5Pf1GGUSJQ3m6PEycX2DFTVFruUMZsHPXoJx",
  },
  // Ed25519VerificationKey2020 instance, or issuer information are available
  // You don't need a privateKeyMultibase for verification!
  key,
]

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
import { pickHighestMatchingLevel, matchLevelOrHigher } from "@idos-network/credentials/utils";

const matched = matchLevelOrHigher("basic", ["liveness"], "basic+liveness")
// matched = true

const matched = matchLevelOrHigher("basic", ["liveness+email"], "basic+liveness")
// matched = false

const matched = matchLevelOrHigher("basic", ["liveness+email"], "plus+liveness")
// matched = true

const pickedLevel = pickHighestMatchingLevel(
  ["basic+liveness", "plus+liveness+email", "plus+liveness+email+phoneNumber"],
  "plus",
  ["liveness", "email"],
);
// pickedLevel = plus+liveness+email+phoneNumber

```
