import { beforeEach, describe, expect, it, vi } from "vitest";

const DAPP = "https://dapp.example";
const EVIL = "https://evil.example";
const ADDRESS = "0xabc";

const env = { VITE_ALLOWED_ORIGINS: "" };
vi.mock("@/env", () => ({ env }));

const approved = new Set<string>();
vi.mock("@/lib/keys", () => ({
  clearKeyMaterial: async () => approved.clear(),
  approveOrigin: async (origin: string) => void approved.add(origin),
  isOriginApproved: async (origin: string) => approved.has(origin),
}));

const { WindowMessageHandler, parseAllowedOrigins } = await import("./window");

const postMessage = vi.fn();
let listener: (event: { origin: string; data: unknown }) => void;

function setup(allowedOrigins: string) {
  env.VITE_ALLOWED_ORIGINS = allowedOrigins;
  vi.stubGlobal("window", {
    self: {},
    top: {},
    parent: { postMessage },
    addEventListener: (_: string, fn: typeof listener) => {
      listener = fn;
    },
    removeEventListener: () => {},
  });

  const sessionProposals: { callback: (approved: boolean, address?: string) => void }[] = [];
  const handler = new WindowMessageHandler(
    () => {},
    (p) => sessionProposals.push(p),
    true,
    async () => ADDRESS,
  );
  handler.init();
  return { sessionProposals };
}

async function requestAddress(origin: string) {
  postMessage.mockClear();
  listener({ origin, data: { type: "address_request", data: { id: 1 } } });
  await vi.waitFor(() => expect(postMessage).toHaveBeenCalled());
  return postMessage.mock.calls[0];
}

async function answerSession(
  sessionProposals: { callback: (approved: boolean, address?: string) => void }[],
  approve: boolean,
) {
  postMessage.mockClear();
  listener({ origin: DAPP, data: { type: "session_proposal", data: { id: 2 } } });
  sessionProposals[0].callback(approve, approve ? ADDRESS : undefined);
  await vi.waitFor(() => expect(postMessage).toHaveBeenCalled());
}

beforeEach(() => {
  approved.clear();
  postMessage.mockClear();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("parseAllowedOrigins", () => {
  it("drops the wildcard and empty entries", () => {
    expect(parseAllowedOrigins(` *, ${DAPP} ,,`)).toEqual([DAPP]);
    expect(parseAllowedOrigins(undefined)).toEqual([]);
  });
});

describe("WindowMessageHandler", () => {
  it("ignores '*' and sends facesign_ready only to listed origins", async () => {
    setup(`*,${DAPP}`);
    expect(postMessage.mock.calls).toEqual([[{ type: "facesign_ready", hasKey: true }, DAPP]]);

    postMessage.mockClear();
    listener({ origin: EVIL, data: { type: "address_request", data: { id: 1 } } });
    await new Promise((r) => setTimeout(r, 0));
    expect(postMessage).not.toHaveBeenCalled();
  });

  it("returns the address only after the user approved a session for that origin", async () => {
    const { sessionProposals } = setup(DAPP);

    expect(await requestAddress(DAPP)).toEqual([
      { type: "address_response", data: { id: 1, address: null } },
      DAPP,
    ]);

    await answerSession(sessionProposals, true);

    expect(await requestAddress(DAPP)).toEqual([
      { type: "address_response", data: { id: 1, address: ADDRESS } },
      DAPP,
    ]);
  });

  it("does not remember a rejected session", async () => {
    const { sessionProposals } = setup(DAPP);

    await answerSession(sessionProposals, false);

    expect(await requestAddress(DAPP)).toEqual([
      { type: "address_response", data: { id: 1, address: null } },
      DAPP,
    ]);
  });
});
