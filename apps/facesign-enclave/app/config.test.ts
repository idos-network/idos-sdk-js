import { describe, expect, it, vi } from "vitest";

import type { env } from "@/env";

import { CONFIGS, isLocalHost, parseAllowedOrigins, resolveConfig } from "@/config";

// What an attacker could set as Vercel environment variables.
const hostileEnv: typeof env = {
  VITE_FACESIGN_SERVICE_URL: "https://facesign.attacker.example",
  VITE_ENTROPY_SERVICE_URL: "https://entropy.attacker.example",
  VITE_FACETEC_DEVICE_KEY_IDENTIFIER: "attacker-device-key",
  VITE_FACETEC_IFRAME_FEATURE_FLAG: "attacker-flag",
  VITE_ALLOWED_ORIGINS: "https://attacker.example",
};

describe("resolveConfig", () => {
  it("serves the fixed production values on facesign.idos.network, whatever the environment says", () => {
    expect(resolveConfig("facesign.idos.network", hostileEnv)).toEqual({
      facesignServiceUrl: "https://facesign.fractal.id",
      entropyServiceUrl: "https://entropy.fractal.id",
      // cspell:disable-next-line
      facetecDeviceKeyIdentifier: "daAezC7MmymLklxL6jwaORL17O6y8aUw",
      facetecIframeFeatureFlag: "991d6c1c-5e5c-4e32-89c7-1ddfac46572e",
      allowedOrigins: ["https://app.idos.network", "https://embedded-wallet.idos.network"],
    });
  });

  it("maps each deployed host to its own environment and parent apps", () => {
    const origins = (host: string) => resolveConfig(host, hostileEnv).allowedOrigins;

    expect(origins("facesign.playground.idos.network")).toEqual([
      "https://app.playground.idos.network",
      "https://embedded-wallet.playground.idos.network",
    ]);
    expect(origins("facesign.staging.idos.network")).toEqual([
      "https://app.staging.idos.network",
      "https://embedded-wallet.staging.idos.network",
    ]);
    // Vercel previews run against staging.
    expect(origins("facesign-enclave-git-x-idos-engineering.vercel.app")).toEqual([
      "https://app.staging.idos.network",
      "https://embedded-wallet.staging.idos.network",
    ]);
    expect(resolveConfig("facesign.staging.idos.network", hostileEnv).entropyServiceUrl).toBe(
      "https://entropy.tee.staging.idos.network/",
    );
  });

  it("refuses hosts it does not know", () => {
    for (const host of ["facesign.idos.network.attacker.example", "attacker.example", ""]) {
      expect(() => resolveConfig(host, hostileEnv)).toThrow(/no configuration/);
    }
    expect(() => resolveConfig("hasOwnProperty", hostileEnv)).toThrow(/no configuration/);
  });

  it("reads the environment on localhost only", () => {
    expect(resolveConfig("localhost", hostileEnv)).toEqual({
      facesignServiceUrl: "https://facesign.attacker.example",
      entropyServiceUrl: "https://entropy.attacker.example",
      facetecDeviceKeyIdentifier: "attacker-device-key",
      facetecIframeFeatureFlag: "attacker-flag",
      allowedOrigins: ["https://attacker.example"],
    });
    expect(() =>
      resolveConfig("127.0.0.1", { ...hostileEnv, VITE_ENTROPY_SERVICE_URL: undefined }),
    ).toThrow(/VITE_ENTROPY_SERVICE_URL/);
  });
});

describe("CONFIGS", () => {
  it("lets production FaceSign talk only to production parent apps", () => {
    for (const origin of CONFIGS.production.allowedOrigins) {
      expect(origin).toMatch(/^https:\/\/[a-z-]+\.idos\.network$/);
      expect(origin).not.toMatch(/staging|playground/);
    }
  });

  it("keeps non-production environments off the production services and origins", () => {
    const { production } = CONFIGS;
    for (const config of [CONFIGS.playground, CONFIGS.staging]) {
      expect(config.facesignServiceUrl).not.toBe(production.facesignServiceUrl);
      expect(config.entropyServiceUrl).not.toBe(production.entropyServiceUrl);
      expect(config.allowedOrigins.some((o) => production.allowedOrigins.includes(o))).toBe(false);
    }
  });

  it("uses https everywhere", () => {
    for (const config of Object.values(CONFIGS)) {
      for (const url of [
        config.facesignServiceUrl,
        config.entropyServiceUrl,
        ...config.allowedOrigins,
      ]) {
        expect(new URL(url).protocol).toBe("https:");
      }
    }
  });
});

describe("parseAllowedOrigins", () => {
  it("drops the wildcard and empty entries", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(parseAllowedOrigins(" *, https://dapp.example ,,")).toEqual(["https://dapp.example"]);
    expect(parseAllowedOrigins(undefined)).toEqual([]);
  });
});

describe("isLocalHost", () => {
  it("accepts localhost and private-network IPs only", () => {
    for (const host of [
      "localhost",
      "127.0.0.1",
      "[::1]",
      "10.0.0.5",
      "172.16.4.2",
      "192.168.1.138",
      "100.97.148.78",
    ]) {
      expect(isLocalHost(host)).toBe(true);
    }
    for (const host of [
      "8.8.8.8",
      "[2001:db8::1]",
      "172.32.0.1",
      "100.128.0.1",
      "192.168.1.1.attacker.example",
      "localhost.attacker.example",
    ]) {
      expect(isLocalHost(host)).toBe(false);
    }
  });
});
