# idOS Credentials JavaScript SDK

`@idos-network/credentials` provides helpers for creating, verifying, parsing, and
classifying idOS verifiable credentials. It wraps the W3C Verifiable Credentials
data model with idOS-specific schemas for KYC and Face ID credential subjects.

## Generated schemas

The files in `src/schemas` are the source of truth for credential definitions.
They are used to generate the JSON-LD assets in `assets` and the TypeScript/Zod
types in `generated`.

Do not edit `assets/*.json` or `generated/**` directly. Update the schema source
and run the schema generator instead:

```sh
pnpm --filter @idos-network/credentials generate:schemas
```

Generated contexts are loaded by URL in issued credentials, for example:

```text
https://idos-network.github.io/idos-sdk-js/credentials/idos-credentials-v1.json
```

## Naming and versioning

Credential data is versioned because the idOS credential format evolves over
time. The package exports explicit versioned container classes and flat
credential subject types.

- `VerifiableCredentialKycV{n}`: versioned KYC credential container.
- `VerifiableCredentialFaceIdV{n}`: versioned Face ID credential container.
- `CredentialSubjectKycV{n}`: flat credential subject type for KYC data.
- `CredentialSubjectFaceIdV{n}`: flat credential subject type for Face ID data.

Use explicit versioned types when reading stored credentials with long-lived
compatibility requirements. Use the latest versioned class when creating new
credentials.

```typescript
import {
  VerifiableCredentialKycV3,
  type CredentialSubjectKycV3,
  type VerifiableCredential,
} from "@idos-network/credentials/types";
```

## Verifiable credentials

idOS credentials are W3C verifiable credentials with an idOS envelope and a
versioned credential subject.

```typescript
export interface VerifiableCredential<K> {
  "@context": string[];
  type: string[];
  issuer: string;
  id: string;
  level: string;
  kycLevel: number;
  issued: string;
  approvedAt: string;
  expirationDate: string;
  credentialSubject: K;
  issuanceDate: string;
  proof: VerifiedCredentialsProof;
}
```

The full credential is what gets encrypted and stored in idOS. Always verify the
credential proof before trusting or using its contents.

## Create an issuer key

Credential containers sign credentials with Ed25519 keys. You can pass either an
`Ed25519VerificationKey2020` instance or issuer key material that can be converted
to one.

```javascript
import { Ed25519VerificationKey2020 } from "@digitalbazaar/ed25519-verification-key-2020";

const issuer = "https://my-issuer.id";

const key = await Ed25519VerificationKey2020.generate({
  id: `${issuer}/keys/1`,
  controller: `${issuer}/issuers/1`,
});
```

For verification, the public key is enough:

```javascript
const trustedIssuer = {
  issuer: "https://my-issuer.id",
  publicKeyMultibase: key.publicKeyMultibase,
};
```

## Build a KYC credential

Credential containers accept structured fields, validate each section with Zod,
and produce the flat credential subject required by JSON-LD. Calling `issue()`
builds and signs the full verifiable credential.

```typescript
import {
  type AvailableIssuerType,
  type CredentialSubjectKycV3,
  type VerifiableCredential,
  VerifiableCredentialKycV3,
} from "@idos-network/credentials/types";

const id = "z6MkszZtxCmA2Ce4vUV132PCuLQmwnaDD5mw2L23fGNnsiX3";

const kycCredential = new VerifiableCredentialKycV3();

kycCredential.setMandatoryEnvelopeFields({
  id: `${issuer}/credentials/${id}`,
  level: "basic+liveness+email",
  kycLevel: 1,
  issued: new Date("2022-01-01").toISOString(),
  approvedAt: new Date("2022-01-01").toISOString(),
  expirationDate: new Date("2030-01-01").toISOString(),
});

kycCredential.setMandatoryFields(
  {
    id: `uuid:${id}`,
  },
  {
    firstName: "John",
    familyName: "Doe",
    dateOfBirth: new Date("1990-01-01"),
    nationality: "US",
  },
  {
    type: "PASSPORT",
    country: "US",
    number: "123456789",
    frontFile: Buffer.from("ID document front"),
  },
);

kycCredential.addContact({
  email: "john@example.com",
});

kycCredential.addBiometric({
  selfieFile: Buffer.from("Selfie"),
});

const issuerKey: AvailableIssuerType = key;

const credential: VerifiableCredential<CredentialSubjectKycV3> =
  await kycCredential.issue(issuerKey);
```

## Build a Face ID credential

```typescript
import { VerifiableCredentialFaceIdV1 } from "@idos-network/credentials/types";

const faceIdCredential = new VerifiableCredentialFaceIdV1();

faceIdCredential.setMandatoryEnvelopeFields({
  id: `${issuer}/credentials/${id}`,
  level: "human",
  approvedAt: new Date("2022-01-01"),
});

faceIdCredential.setMandatoryFields({
  faceSignUserId: "11111111-1111-1111-1111-111111111111",
});

const issuedFaceIdCredential = await faceIdCredential.issue(key);
```

## Verify a credential

`verifyCredential` checks a credential against a list of trusted issuers. It
returns as soon as one issuer verifies the credential successfully.

```javascript
import { verifyCredential } from "@idos-network/credentials/verifier";

const allowedIssuers = [
  {
    issuer: "https://my-issuer.id",
    publicKeyMultibase: key.publicKeyMultibase,
  },
  key,
];

const [verified, resultsByIssuer] = await verifyCredential(credential, allowedIssuers);

console.log("Verified:", verified);
console.log("Results by issuer:", resultsByIssuer);
```

## Parse a credential

The parser reads the JSON-LD context and returns the matching versioned
credential container with structured `envelope` and `subject` fields. Unknown
contexts throw an error so callers can handle unsupported versions explicitly.

```typescript
import { parseCredential } from "@idos-network/credentials/parser";
import { VerifiableCredentialKycV3 } from "@idos-network/credentials/types";

const parsed = await parseCredential(credential);

if (parsed instanceof VerifiableCredentialKycV3) {
  console.log(parsed.subject.person?.firstName);
}
```

## Derive a level

`deriveLevel` derives the string level from KYC v3 structured subject data. The
current implementation treats address proof as `plus` and adds optional addons
for liveness, email, and phone number.

```javascript
import { deriveLevel } from "@idos-network/credentials/utils";

const level = deriveLevel({
  root: {
    id: "uuid:1234",
  },
  person: {
    firstName: "John",
    familyName: "Doe",
    dateOfBirth: new Date("1990-01-01"),
    nationality: "US",
  },
  contact: {
    email: "john@example.com",
  },
  biometric: {
    selfieFile: Buffer.from("Selfie"),
  },
});

// level = "basic+liveness+email"
```

## Match levels and credentials

Use the matching helpers to check whether a credential level satisfies a required
base level and set of addons, or to pick the strongest matching credential from a
list.

```javascript
import {
  highestMatchingCredential,
  matchLevelOrHigher,
  pickHighestMatchingLevel,
} from "@idos-network/credentials/utils";

const hasBasicLiveness = matchLevelOrHigher("basic", ["liveness"], "basic+liveness");
// hasBasicLiveness = true

const hasBasicLivenessAndEmail = matchLevelOrHigher(
  "basic",
  ["liveness", "email"],
  "basic+liveness",
);
// hasBasicLivenessAndEmail = false

const hasBasicLivenessFromPlus = matchLevelOrHigher("basic", ["liveness"], "plus+liveness");
// hasBasicLivenessFromPlus = true

const pickedLevel = pickHighestMatchingLevel(
  ["basic+liveness", "plus+liveness+email", "plus+liveness+email+phoneNumber"],
  "plus",
  ["liveness", "email"],
);
// pickedLevel = "plus+liveness+email+phoneNumber"

const pickedCredential = highestMatchingCredential([...idOSCredentials], "basic", {
  addons: ["email", "liveness"],
  publicNotesConstraint: {
    status: "approved",
    type: "kyc",
  },
});
// pickedCredential is the highest-scoring credential that matches the level,
// addons, and public notes constraints.
```
