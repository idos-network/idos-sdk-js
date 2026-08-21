# idOS Credentials JavaScript SDK

`@idos-network/credentials` provides helpers for creating, verifying, parsing, and
classifying idOS verifiable credentials. It wraps the W3C Verifiable Credentials
data model with idOS-specific schemas for KYC, Face ID and EDD credential subjects.

Credentials are built and read through versioned classes. Each holds structured
`envelope` and `subject` data, validates it with `class-validator` decorators, and
can:

- `serializeSubject()` structured subject sections into the flat JSON-LD credential subject
- `deserialize()` a signed verifiable credential back into structured fields
- `issue()` a signed W3C verifiable credential from the current state

## Generated schemas

The classes in `src/schemas` are the source of truth for credential definitions.
The JSON-LD assets in `assets` are generated from them by reflecting over their
decorators.

Do not edit `assets/*.json` directly. Update the classes and run the generator,
which builds the package first because it reflects over `dist`:

```sh
pnpm --filter @idos-network/credentials generate:schemas
```

Generated contexts are loaded by URL in issued credentials, for example:

```text
https://idos-network.github.io/idos-sdk-js/credentials/idos-credentials-v2.json
https://idos-network.github.io/idos-sdk-js/credentials/idos-credential-subject-v3.json
```

## Naming and versioning

Credential data is versioned because the idOS credential format evolves over
time. The package exports explicit versioned classes from
`@idos-network/credentials/schemas`:

| Class                          | Subject context                           |
| ------------------------------ | ----------------------------------------- |
| `VerifiableCredentialKycV1`    | `idos-credential-subject-v1.json`         |
| `VerifiableCredentialKycV2`    | `idos-credential-subject-v2.json`         |
| `VerifiableCredentialKycV3`    | `idos-credential-subject-v3.json`         |
| `VerifiableCredentialFaceIdV1` | `idos-credential-subject-face-id-v1.json` |
| `VerifiableCredentialEddV1`    | `idos-credential-subject-edd-v1.json`     |

Use explicit versioned classes when reading stored credentials with long-lived
compatibility requirements. Use the latest version when creating new credentials.

```typescript
import { VerifiableCredentialKycV3 } from "@idos-network/credentials/schemas";
import type { VerifiableCredential } from "@idos-network/credentials/types";
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
  expirationDate?: string;
  credentialSubject: K;
  issuanceDate: string;
  proof: VerifiableCredentialProof;
}
```

The full credential is what gets encrypted and stored in idOS. Always verify the
credential proof before trusting or using its contents.

Working with credentials means using a versioned class rather than editing the
flat JSON-LD shape by hand:

| Field / method             | Role                                                       |
| -------------------------- | ---------------------------------------------------------- |
| `envelope`                 | Structured envelope fields (`id`, `level`, dates, …)       |
| `subject`                  | Structured subject: its own fields plus sections           |
| `setEnvelope(fields)`      | Set envelope fields                                        |
| `setSubject(fields)`       | Set the subject's own fields, such as `id`                 |
| `addSection(name, fields)` | Add one subject section (`person`, `idDocument`, …)        |
| `checkValidity()`          | Derive missing fields, then validate both halves           |
| `serializeSubject()`       | Flatten `subject` into the JSON-LD credential subject      |
| `serializeEnvelope()`      | The flat envelope fields                                   |
| `deserialize(vc)`          | Rebuild `envelope` and `subject` from an issued credential |
| `issue(issuer)`            | Sign a full verifiable credential                          |
| `level()` / `kycLevel()`   | Derive level values from structured subject data           |
| `publicNotes()`            | The notes stored unencrypted alongside the credential      |

`setEnvelope`, `setSubject` and `addSection` all return the credential, so calls
chain. Each rejects fields the target does not declare — a misspelled field would
otherwise vanish on serialization and produce a credential silently missing data.

Serialization converts `Date` values to ISO strings and `Buffer` files to base85;
deserialization reverses both. Sections are flattened with their name as a prefix
(`person.firstName` → `personFirstName`), while the subject's own fields travel
unprefixed.

## Create an issuer key

Credentials are signed with Ed25519 keys. You can pass either an
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

Each section is validated as it is added, and `issue()` builds and signs the full
verifiable credential. For KYC v3, `level` and `kycLevel` can be omitted from the
envelope: they are derived from the subject data during `serializeSubject()` /
`issue()`. `expirationDate` is derived only when `subject.idDocument.dateOfExpiry`
exists; otherwise it remains absent.

```typescript
import { VerifiableCredentialKycV3 } from "@idos-network/credentials/schemas";
import type { AvailableIssuerType, VerifiableCredential } from "@idos-network/credentials/types";

const id = "z6MkszZtxCmA2Ce4vUV132PCuLQmwnaDD5mw2L23fGNnsiX3";

const kycCredential = new VerifiableCredentialKycV3()
  .setEnvelope({
    id: `${issuer}/credentials/${id}`,
    issued: new Date("2022-01-01"),
    approvedAt: new Date("2022-01-01"),
    expirationDate: new Date("2030-01-01"),
  })
  .setSubject({ id: `uuid:${id}` })
  .addSection("person", {
    firstName: "John",
    familyName: "Doe",
    dateOfBirth: new Date("1990-01-01"),
    nationality: "US",
  })
  .addSection("idDocument", {
    type: "PASSPORT",
    country: "US",
    number: "123456789",
    frontFile: Buffer.from("ID document front"),
  })
  .addSection("contact", {
    email: "john@example.com",
  })
  .addSection("biometric", {
    selfieFile: Buffer.from("Selfie"),
  });

// Optional: inspect the flat subject or derived level without issuing
const flatSubject = kycCredential.serializeSubject();
const level = kycCredential.level(); // "basic+liveness+email"

const issuerKey: AvailableIssuerType = key;

const credential: VerifiableCredential<unknown> = await kycCredential.issue(issuerKey);
```

Dates and files are accepted in either form: `new Date("2022-01-01")` or its ISO
string, a `Buffer` or its base85 encoding.

## Build a Face ID credential

```typescript
import { VerifiableCredentialFaceIdV1 } from "@idos-network/credentials/schemas";

const faceIdCredential = new VerifiableCredentialFaceIdV1()
  .setEnvelope({
    id: `${issuer}/credentials/${id}`,
    approvedAt: new Date("2022-01-01"),
  })
  .setSubject({
    faceSignUserId: "11111111-1111-1111-1111-111111111111",
  });

const issuedFaceIdCredential = await faceIdCredential.issue(key);
// issuedFaceIdCredential.level === "human", derived rather than set
```

## Serialize and deserialize

Use `serializeSubject()` when you need the flat credential subject. Use
`deserialize()` when you already have a verifiable credential and want structured
access to its fields.

```typescript
import { VerifiableCredentialKycV3 } from "@idos-network/credentials/schemas";

const flatSubject = kycCredential.serializeSubject();
// Dates -> ISO strings, Buffers -> base85, sections -> prefixed keys
// e.g. person.firstName -> personFirstName

const roundTrip = new VerifiableCredentialKycV3();
await roundTrip.deserialize(credential);

console.log(roundTrip.envelope.id);
console.log(roundTrip.subject.person?.firstName);
console.log(roundTrip.subject.idDocument?.frontFile); // Buffer
```

`deserialize()` rejects a credential whose subject carries a field the version does
not declare: the subject context defines the subject exhaustively, so an unknown
key means the credential does not match the `@context` it claims. The envelope is
the lenient half — the credential's own W3C fields (`proof`, `issuanceDate`,
`type`, `issuer`) are dropped rather than rejected.

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

`parseCredential` inspects the credential subject `@context`, constructs the
matching version, then deserializes and validates it. An unknown context throws so
callers can handle unsupported versions explicitly.

Parsing does **not** verify the signature — the result reflects whatever was in the
input, signed or forged. For untrusted input call `verifyCredential()` first, and
only parse once it reports verified.

```typescript
import { parseCredential } from "@idos-network/credentials/parser";
import { VerifiableCredentialKycV3 } from "@idos-network/credentials/schemas";

const parsed = await parseCredential(credential);

if (parsed instanceof VerifiableCredentialKycV3) {
  console.log(parsed.subject.person?.firstName);
  console.log(parsed.level());
}
```

## Derive a level

For KYC v3, call `level()` to derive the string level from structured subject data:
a verified address proof yields `plus`, and optional addons include `liveness`,
`email`, `phoneNumber`, `edd`, `sow`, `screening`, and `onboarding`. `kycLevel()`
derives the numeric level (0–3) from the same data.

```javascript
import { VerifiableCredentialKycV3 } from "@idos-network/credentials/schemas";

const kycCredential = new VerifiableCredentialKycV3()
  .setSubject({ id: "uuid:1234" })
  .addSection("person", {
    firstName: "John",
    familyName: "Doe",
    dateOfBirth: new Date("1990-01-01"),
    nationality: "US",
  })
  .addSection("idDocument", {
    type: "PASSPORT",
    country: "US",
    number: "123456789",
    frontFile: Buffer.from("ID document front"),
  })
  .addSection("contact", {
    email: "john@example.com",
  })
  .addSection("biometric", {
    selfieFile: Buffer.from("Selfie"),
  });

const level = kycCredential.level();
// level = "basic+liveness+email"

const kycLevel = kycCredential.kycLevel();
// kycLevel = 1
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
