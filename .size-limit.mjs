import { readFileSync } from "node:fs";

// Sizes include bundled dependencies (@size-limit/esbuild); peer deps are the app's own choice, so they're excluded.
const ignore = [
  "@near-wallet-selector/core",
  "@opentelemetry/api",
  "@partisiablockchain/abi-client",
  "@partisiablockchain/blockchain-api-transaction-client",
  "@stellar/stellar-sdk",
  // shortcut: enclave/mpc imports Node's crypto, so browser apps pay for a polyfill not counted here; drop once mpc uses WebCrypto.
  "crypto",
  "ethers",
  "near-api-js",
  "ripple-keypairs",
  "typescript",
  "viem",
  "xrpl",
];

// ~10% above the size measured when the limit was set. A new export without a limit is still reported, just not enforced.
const limits = {
  "@idos-network/client": "175 kB",
  "@idos-network/consumer": "215 kB",
  "@idos-network/issuer": "170 kB",
  "@idos-network/credentials": "1 kB",
  "@idos-network/credentials/utils": "95 kB",
  "@idos-network/credentials/verifier": "65 kB",
  "@idos-network/credentials/parser": "105 kB",
  "@idos-network/credentials/types": "1 kB",
  "@idos-network/credentials/schemas": "105 kB",
  "@idos-network/enclave": "45 kB",
  "@idos-network/enclave/local": "95 kB",
  "@idos-network/enclave/mpc": "55 kB",
  "@idos-network/kwil-infra": "165 kB",
  "@idos-network/kwil-infra/actions": "45 kB",
  "@idos-network/kwil-infra/signature-verification": "35 kB",
  "@idos-network/kwil-infra/xrp-utils": "2 kB",
  "@idos-network/kwil-infra/facesign": "2 kB",
  "@idos-network/kwil-infra/xrpl-credentials": "25 kB",
  "@idos-network/utils": "1 kB",
  "@idos-network/utils/store": "2 kB",
  "@idos-network/utils/codecs": "25 kB",
  "@idos-network/utils/cryptography": "35 kB",
  "@idos-network/utils/blob-gateway": "80 kB",
  "@idos-network/utils/encryption": "35 kB",
  "@idos-network/utils/facesign": "45 kB",
  "@idos-network/instrumentation": "4 kB",
};

// One check per public import path (package.json "exports"), importing all of its exports so tree-shaking can't hide anything.
const entries = (pkg) => {
  const dir = `packages/${pkg}`;
  const { exports } = JSON.parse(readFileSync(`${dir}/package.json`, "utf8"));
  return Object.entries(exports).map(([subpath, { import: file }]) => {
    const name = `@idos-network/${pkg}${subpath.slice(1)}`;
    const path = `${dir}/${file.slice(2)}`;
    return { name, path, import: { [path]: "*" }, ignore, limit: limits[name] };
  });
};

export default [
  "client",
  "consumer",
  "issuer",
  "credentials",
  "enclave",
  "kwil-infra",
  "utils",
  "instrumentation",
].flatMap(entries);
