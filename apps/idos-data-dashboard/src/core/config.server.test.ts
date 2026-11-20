import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const serverEnv = vi.hoisted(() => ({
  RELAY_URL: "https://relay.playground.idos.network",
  RELAY_API_KEY: "test-relay-api-key",
}));

vi.mock("@/core/envFlags.server", () => ({ SERVER_ENV: serverEnv }));

import { ALLOWED_NODE_URLS, ALLOWED_RELAY_URLS, assertAllowedUrl, relayUrl } from "./config.server";
import { createRelayClient } from "./relay.server";

const JOURNEY_REQUEST = {
  name: "Test",
  email: "test@example.com",
  publicKey: "pk",
  consumerWallet: "0x0",
  consumerEncPubKey: "enc",
  blockedCountries: [],
};

describe("assertAllowedUrl", () => {
  it.each([...ALLOWED_NODE_URLS, ...ALLOWED_NODE_URLS.map((u) => `${u}/`)])(
    "accepts %s and returns its origin",
    (url) => {
      expect(assertAllowedUrl("X", url, ALLOWED_NODE_URLS, false)).toBe(url.replace(/\/$/, ""));
    },
  );

  it("normalizes letter case to the allowed origin", () => {
    expect(assertAllowedUrl("X", "HTTPS://Nodes.IDOS.network", ALLOWED_NODE_URLS, false)).toBe(
      "https://nodes.idos.network",
    );
  });

  it.each([
    "https://attacker.example",
    "http://nodes.idos.network",
    "https://nodes.idos.network:8443",
    "https://nodes.idos.network.attacker.example",
    "https://nodes.idos.network@attacker.example",
    "https://user:pass@nodes.idos.network",
    "https://nodes.idos.network/proxy",
    "https://nodes.idos.network/?to=attacker",
    "https://relay.idos.network",
    "not a url",
    undefined,
  ])("refuses %s", (url) => {
    expect(() => assertAllowedUrl("X", url, ALLOWED_NODE_URLS, false)).toThrow(/X/);
  });

  it("accepts a loopback URL only when allowed", () => {
    expect(assertAllowedUrl("X", "http://localhost:8484", ALLOWED_NODE_URLS, true)).toBe(
      "http://localhost:8484",
    );
    expect(() => assertAllowedUrl("X", "http://localhost:8484", ALLOWED_NODE_URLS, false)).toThrow(
      /not allowed/,
    );
  });

  it("does not let a loopback exception widen to other hosts", () => {
    expect(() =>
      assertAllowedUrl("X", "https://attacker.example", ALLOWED_NODE_URLS, true),
    ).toThrow(/not allowed/);
  });
});

describe("relayUrl and the Relay client", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    serverEnv.RELAY_URL = "https://relay.playground.idos.network";
  });

  it("accepts each idOS Relay", () => {
    for (const url of ALLOWED_RELAY_URLS) {
      serverEnv.RELAY_URL = url;
      expect(relayUrl()).toBe(url);
    }
  });

  it("sends the API key to an allowed Relay", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ id: "client-1" }), { status: 200 }));

    await expect(createRelayClient(JOURNEY_REQUEST)).resolves.toBe("client-1");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://relay.playground.idos.network/developer/console/clients",
      expect.anything(),
    );
  });

  it("never sends the API key to another host", async () => {
    serverEnv.RELAY_URL = "https://attacker.example";

    await expect(createRelayClient(JOURNEY_REQUEST)).rejects.toThrow(/RELAY_URL/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
