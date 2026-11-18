import { describe, expect, it } from "vitest";

import { CONFIGS, isLocalHost, resolveConfig } from "./config";

const JUNK_ENV = {
  DATA_DASHBOARD_URL: "https://attacker.example",
  FACESIGN_ENCLAVE_URL: "https://attacker.example/facesign",
};

describe("resolveConfig", () => {
  it("gives the production host the production values, whatever the environment says", () => {
    expect(resolveConfig("embedded-wallet.idos.network", JUNK_ENV)).toEqual({
      dataDashboardUrl: "https://app.idos.network",
      faceSignEnclaveUrl: "https://facesign.idos.network",
    });
  });

  it.each([
    ["embedded-wallet.playground.idos.network", "playground"],
    ["embedded-wallet.staging.idos.network", "staging"],
  ] as const)("gives %s the %s values", (hostname, name) => {
    expect(resolveConfig(hostname, JUNK_ENV)).toBe(CONFIGS[name]);
  });

  it("gives Vercel previews the staging values", () => {
    expect(resolveConfig("embedded-wallet-git-branch-idos.vercel.app", JUNK_ENV)).toBe(
      CONFIGS.staging,
    );
  });

  it.each([
    "embedded-wallet.idos.network.attacker.example",
    "attacker.example",
    "app.idos.network",
  ])("refuses the unknown host %s", (hostname) => {
    expect(() => resolveConfig(hostname, JUNK_ENV)).toThrow(/no configuration/);
  });

  it("keeps every URL of an environment inside that environment", () => {
    for (const name of ["playground", "staging"] as const) {
      for (const url of Object.values(CONFIGS[name])) {
        expect(new URL(url).hostname).toMatch(new RegExp(`\\.${name}\\.idos\\.network$`));
      }
    }
    for (const url of Object.values(CONFIGS.production)) {
      expect(url).not.toMatch(/playground|staging/);
      expect(new URL(url).protocol).toBe("https:");
    }
  });

  it("reads the environment on local development hosts", () => {
    expect(resolveConfig("localhost", JUNK_ENV)).toEqual({
      dataDashboardUrl: JUNK_ENV.DATA_DASHBOARD_URL,
      faceSignEnclaveUrl: JUNK_ENV.FACESIGN_ENCLAVE_URL,
    });
    expect(resolveConfig("192.168.1.20", {})).toEqual({
      dataDashboardUrl: undefined,
      faceSignEnclaveUrl: undefined,
    });
  });

  it.each(["8.8.8.8", "localhost.attacker.example"])("does not treat %s as local", (hostname) => {
    expect(isLocalHost(hostname)).toBe(false);
  });
});
