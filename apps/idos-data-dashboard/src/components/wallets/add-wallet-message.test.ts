import { describe, expect, it } from "vitest";

import { addWalletMessage, walletSignatureMatchesRequest } from "./add-wallet-message";

const userId = "11111111-1111-4111-8111-111111111111";
const requestId = "22222222-2222-4222-8222-222222222222";

describe("addWalletMessage", () => {
  const message = addWalletMessage(userId, requestId);

  it("matches only the profile and request it was built for", () => {
    expect(walletSignatureMatchesRequest(message, userId, requestId)).toBe(true);
    expect(walletSignatureMatchesRequest(message, userId, crypto.randomUUID())).toBe(false);
    expect(
      walletSignatureMatchesRequest(message, "33333333-3333-4333-8333-333333333333", requestId),
    ).toBe(false);
  });

  it("names the profile and request on their own lines", () => {
    expect(message.split("\n").at(-2)).toBe(`idOS profile: ${userId}`);
    expect(message.split("\n").at(-1)).toBe(`Request: ${requestId}`);
  });
});
