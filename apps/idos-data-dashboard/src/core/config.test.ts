import { afterEach, describe, expect, it, vi } from "vitest";

import { CONFIGS, getConfig, isFaceSignEnabled, isLocalHost, resolveConfig } from "./config";

const JUNK_ENV = {
  IDOS_NODE_URL: "https://attacker.example/node",
  IDOS_ENCLAVE_URL: "https://attacker.example/enclave",
  FACESIGN_ENCLAVE_URL: "https://attacker.example/facesign",
  EMBEDDED_WALLET_APP_URLS: "https://attacker.example/wallet",
};

function allUrls(config: (typeof CONFIGS)[keyof typeof CONFIGS]): string[] {
  return [
    config.idosNodeUrl,
    config.idosEnclaveUrl,
    config.faceSignEnclaveUrl ?? "",
    ...config.embeddedWalletAppUrls,
  ];
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("resolveConfig", () => {
  it("gives production hosts the production values, whatever the environment says", () => {
    expect(resolveConfig("app.idos.network", JUNK_ENV)).toEqual({
      idosNodeUrl: "https://nodes.idos.network",
      idosEnclaveUrl: "https://enclave.idos.network",
      faceSignEnclaveUrl: "https://facesign.idos.network",
      embeddedWalletAppUrls: ["https://embedded-wallet.idos.network"],
    });
  });

  it.each([
    ["app.playground.idos.network", "playground"],
    ["app.staging.idos.network", "staging"],
  ] as const)("gives %s the %s values", (hostname, name) => {
    expect(resolveConfig(hostname, JUNK_ENV)).toBe(CONFIGS[name]);
  });

  it("gives Vercel previews the staging values", () => {
    expect(resolveConfig("data-dashboard-git-branch-idos.vercel.app", JUNK_ENV)).toBe(
      CONFIGS.staging,
    );
  });

  it.each([
    "dashboard.idos.network",
    "app.idos.network.attacker.example",
    "attacker.example",
    "vercel.app.attacker.example",
  ])("refuses the unknown host %s", (hostname) => {
    expect(() => resolveConfig(hostname, JUNK_ENV)).toThrow(/no configuration/);
  });

  it("keeps every URL of an environment inside that environment", () => {
    for (const url of [...allUrls(CONFIGS.playground), ...allUrls(CONFIGS.staging)]) {
      expect(new URL(url).hostname).toMatch(/\.(playground|staging)\.idos\.network$/);
    }
    for (const url of allUrls(CONFIGS.playground)) expect(url).toContain(".playground.");
    for (const url of allUrls(CONFIGS.staging)) expect(url).toContain(".staging.");
    for (const url of allUrls(CONFIGS.production)) {
      expect(url).not.toMatch(/playground|staging/);
      expect(new URL(url).protocol).toBe("https:");
    }
  });

  it("reads the environment on local development hosts", () => {
    expect(
      resolveConfig("localhost", {
        IDOS_NODE_URL: "https://nodes.staging.idos.network",
        IDOS_ENCLAVE_URL: "https://localhost:5174",
        EMBEDDED_WALLET_APP_URLS: "https://localhost:5175/, https://localhost:5176",
      }),
    ).toEqual({
      idosNodeUrl: "https://nodes.staging.idos.network",
      idosEnclaveUrl: "https://localhost:5174",
      faceSignEnclaveUrl: undefined,
      embeddedWalletAppUrls: ["https://localhost:5175/", "https://localhost:5176"],
    });
  });

  it("requires the node and enclave URLs locally", () => {
    expect(() => resolveConfig("127.0.0.1", {})).toThrow(/VITE_IDOS_NODE_URL/);
  });

  it.each(["localhost", "[::1]", "127.0.0.1", "192.168.1.20", "10.0.0.5", "172.20.1.1"])(
    "treats %s as local",
    (hostname) => {
      expect(isLocalHost(hostname)).toBe(true);
    },
  );

  it.each(["app.idos.network", "8.8.8.8", "172.32.0.1", "localhost.attacker.example"])(
    "does not treat %s as local",
    (hostname) => {
      expect(isLocalHost(hostname)).toBe(false);
    },
  );
});

describe("getConfig", () => {
  it("is not available on the server", () => {
    expect(() => getConfig()).toThrow(/only available in the browser/);
  });
});

describe("isFaceSignEnabled on the server", () => {
  it("says yes in a production build, which only serves deployed hosts", () => {
    vi.stubEnv("DEV", false);
    expect(isFaceSignEnabled()).toBe(true);
  });
});
