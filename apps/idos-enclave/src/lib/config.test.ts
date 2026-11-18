import { describe, expect, it } from "vitest";

import { CONFIGS, isLocalHost, type LocalEnv, resolveConfig } from "@/lib/config";

// What an attacker could set as Vercel environment variables.
const hostileEnv: LocalEnv = {
  VITE_ENABLE_MPC: "true",
  VITE_MPC_READER_NODE_URL: "https://reader.attacker.example",
  VITE_MPC_CONTRACT_ADDRESS: "02attacker",
  VITE_MPC_NUM_MALICIOUS: "0",
  VITE_MPC_NUM_NODES: "1",
  VITE_MPC_NUM_TO_RECONSTRUCT: "1",
};

describe("resolveConfig", () => {
  it("serves the fixed production values on enclave.idos.network, whatever the environment says", () => {
    expect(resolveConfig("enclave.idos.network", hostileEnv)).toEqual({
      allowedEncryptionStores: ["mpc", "user"],
      mpcConfiguration: {
        nodeUrl: "https://partisia-reader-node.idos.network:8080",
        // cspell:disable-next-line
        contractAddress: "02b4a0a1bf8dd39b05f9082d60e992e7c455e1f957",
        numMalicious: 2,
        numNodes: 6,
        numToReconstruct: 4,
      },
    });
  });

  it("maps each deployed host to its own environment", () => {
    expect(resolveConfig("enclave.playground.idos.network", hostileEnv)).toBe(CONFIGS.playground);
    expect(resolveConfig("enclave.staging.idos.network", hostileEnv)).toBe(CONFIGS.staging);
    expect(resolveConfig("idos-enclave-git-x-idos-engineering.vercel.app", hostileEnv)).toBe(
      CONFIGS.staging,
    );
  });

  it("refuses hosts it does not know", () => {
    for (const host of [
      "enclave.idos.network.attacker.example",
      "attacker.example",
      "",
      "toString",
    ]) {
      expect(() => resolveConfig(host, hostileEnv)).toThrow(/no configuration/);
    }
  });

  it("reads the environment on localhost only", () => {
    expect(resolveConfig("127.0.0.1", {})).toEqual({ allowedEncryptionStores: ["user"] });
    expect(() =>
      resolveConfig("localhost", { ...hostileEnv, VITE_MPC_CONTRACT_ADDRESS: undefined }),
    ).toThrow(/VITE_MPC_CONTRACT_ADDRESS must be set/);
    expect(resolveConfig("localhost", hostileEnv).mpcConfiguration).toEqual({
      nodeUrl: "https://reader.attacker.example",
      contractAddress: "02attacker",
      numMalicious: 0,
      numNodes: 1,
      numToReconstruct: 1,
    });
  });
});

describe("CONFIGS", () => {
  it("keeps production and playground thresholds sound", () => {
    // Staging (4 nodes, 2 to reconstruct, 2 malicious) copies infra as it stands and is below
    // the numMalicious + 1 minimum that shamir-secret-shares.ts documents. Fix it in infra and
    // here together, then add it to this list.
    for (const { mpcConfiguration: mpc } of [CONFIGS.production, CONFIGS.playground]) {
      expect(mpc).toBeDefined();
      if (!mpc) continue;
      // shamir-secret-shares.ts: numToReconstruct must be at least numMalicious + 1.
      expect(mpc.numToReconstruct).toBeGreaterThanOrEqual(mpc.numMalicious + 1);
      expect(mpc.numToReconstruct).toBeLessThanOrEqual(mpc.numNodes);
      expect(new URL(mpc.nodeUrl).protocol).toBe("https:");
    }
  });

  it("pins production to six nodes and the idOS reader", () => {
    const mpc = CONFIGS.production.mpcConfiguration;
    expect(mpc?.numNodes).toBe(6);
    expect(new URL(mpc?.nodeUrl ?? "").hostname).toBe("partisia-reader-node.idos.network");
  });

  it("keeps non-production environments off the production contract and reader", () => {
    const production = CONFIGS.production.mpcConfiguration;
    for (const config of [CONFIGS.playground, CONFIGS.staging]) {
      expect(config.mpcConfiguration?.contractAddress).not.toBe(production?.contractAddress);
      expect(config.mpcConfiguration?.nodeUrl).not.toBe(production?.nodeUrl);
    }
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
