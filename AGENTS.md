# Agent instructions

After you change code or docs, before you report the work as done:

## 1. Spell check

CI runs cspell on every PR (`.github/workflows/format.yml`). Run it on the files you touched:

```sh
pnpm dlx cspell --no-progress --no-must-find-files $(git diff --name-only origin/main...HEAD) $(git diff --name-only)
```

- Fix real typos.
- Add genuine project terms (identifiers, product names, crypto jargon) to `project-words.txt`, keeping it sorted. Don't add misspellings.
- Don't widen `ignorePaths` in `cspell.config.yaml` to silence a warning.

## 2. OpenTelemetry traces

`packages/instrumentation` patches public SDK methods by name, listed in `packages/instrumentation/src/targets.ts`. A rename or removal there fails silently: the span just stops appearing. If your change touches a public class in an instrumented package (`@idos-network/kwil-infra`, `@idos-network/client`, `@idos-network/issuer`, `@idos-network/consumer`), check:

- **Still valid**: every method in `TARGETS` still exists on its class, with the same argument shape that `attributes` / `spanName` read.
- **Still meaningful**: span names and attributes still describe what the method does.
- **Missing**: a new public method that does network I/O, signing, or encryption probably deserves a target. Pure getters and helpers don't.
- **No personal data**: attributes may carry fixed identifiers (action names, tx hashes), never user input, addresses, credential contents, or keys.

When you change `targets.ts`, update `packages/instrumentation/src/instrumentation.test.ts` and the package README if it documents the span list. If nothing needs to change, say so in one line in your summary.
