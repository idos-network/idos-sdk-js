---
"@idos-network/credentials": minor
---

Add Latin forms of KycV3 fields stored in their original script (Cyrillic, German umlauts, …). A field marked with the new `@Transliterate()` decorator gets two read-only siblings, derived on read and never serialized:

- `<field>Icao`: transliterated per ICAO 9303, as passports print names in the MRZ.
- `<field>Latin`: a promise of the conventional spelling, backed by the `transliteration` package.

The person's names and the address's street, additional info, region and city are marked.

`transliteration` is an optional peer dependency this package never imports, so it adds nothing to an app that does not use `<field>Latin`. An app that does installs it and registers it once at startup; without that, `<field>Latin` rejects with instructions:

```ts
import { registerTransliteration } from "@idos-network/credentials/utils";

registerTransliteration(() => import("transliteration"));
```
