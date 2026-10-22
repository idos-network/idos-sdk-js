# Vendored `base85`

Copy of [noseglid/base85](https://github.com/noseglid/base85) at commit
`554f00d3c8237a4ecfb198f8d4a84ac2f4a171dd` (2026-10-05, MIT, see `LICENSE`) with
the two performance PRs below merged on top.

The npm release (3.2.0, March 2025) lacks the fix for multiple `z` groups
([noseglid/base85#25](https://github.com/noseglid/base85/pull/25)) and upstream
publishes rarely. Once these three PRs are merged and released, drop this
directory and go back to the `base85` package:

- https://github.com/noseglid/base85/pull/26 (faster decode)
- https://github.com/noseglid/base85/pull/27 (faster encode)
- https://github.com/noseglid/base85/pull/28 (ip-address CVE bump)

Local changes against upstream:

- `base85.js`: PR 26 and 27 applied. PR 26's merge with master left `decodeBuffer`
  with a `buffer` parameter shadowed by PR 25's `const buffer` (a syntax error);
  the parameter is `ibuffer` here. Dropped `import { Buffer } from 'buffer'`;
  the global `Buffer` is used, like the rest of `codecs`. Added named
  `encode`/`decode` exports to match `base85.d.ts`. IPv6 helpers use the
  `ip-address` 10 API (`Address6.isValid`, `fromBigInt`), since the workspace
  pins `ip-address >= 10.3.1`.
- `tests/`: fixture paths resolved from `import.meta.dirname` instead of the cwd.
- Formatted with the repo's `oxfmt`.
