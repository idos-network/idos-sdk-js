import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createJsonRequest, getSetCookieHeader } from "@/test/helpers";

import { action, loader } from "./profile";

const { init, addWalletMessage, createUser } = vi.hoisted(() => {
  const addWalletMessage = vi.fn(async (params: { user_id: string; address: string }) => {
    return `msg:${params.user_id}`;
  });
  const createUser = vi.fn(async () => [{}, {}]);
  const issuer = { addWalletMessage, createUser };
  const init = vi.fn(async () => issuer);
  return { init, addWalletMessage, createUser };
});

vi.mock("@idos-network/issuer", () => ({
  idOSIssuer: { init },
}));

function loaderArgs(address = "0xabc", walletType = "EVM") {
  return {
    request: new Request(
      `http://localhost/api/profile?address=${address}&walletType=${walletType}`,
    ),
  } as Parameters<typeof loader>[0];
}

function actionArgs(request: Request) {
  return { request } as Parameters<typeof action>[0];
}

describe("/api/profile loader", () => {
  beforeEach(() => {
    init.mockReset();
    addWalletMessage.mockClear();
    createUser.mockClear();
    init.mockImplementation(async () => ({ addWalletMessage, createUser }));
  });

  it("reuses one issuer and still challenges each request", async () => {
    init.mockRejectedValueOnce(new Error("node down"));
    await expect(loader(loaderArgs())).rejects.toThrow("node down");

    const first = await loader(loaderArgs("0xabc"));
    const second = await loader(loaderArgs("0xdef"));
    const firstBody = await first.json();
    const secondBody = await second.json();

    expect(init).toHaveBeenCalledTimes(2);
    expect(addWalletMessage).toHaveBeenCalledTimes(2);
    expect(firstBody.userId).not.toBe(secondBody.userId);
    expect(addWalletMessage).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        address: "0xabc",
        user_id: firstBody.userId,
        not_before: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
        not_after: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
      }),
    );
    expect(addWalletMessage).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ address: "0xdef", user_id: secondBody.userId }),
    );
  });
});

describe("/api/profile action", () => {
  beforeEach(() => {
    createUser.mockClear();
  });

  it("recovers an EVM public key when the client omits one", async () => {
    const account = privateKeyToAccount(generatePrivateKey());
    const challengeResponse = await loader(loaderArgs(account.address));
    const challenge = await challengeResponse.json();
    const signature = await account.signMessage({ message: challenge.proofMessage });

    const response = await action(
      actionArgs(
        createJsonRequest("http://localhost/api/profile", {
          method: "POST",
          headers: { Cookie: getSetCookieHeader(challengeResponse) },
          body: {
            recipientEncryptionPublicKey: "recipient-key",
            encryptionPasswordStore: "mpc",
            walletType: "EVM",
            walletAddress: account.address,
            walletPublicKey: "",
            signature,
          },
        }),
      ),
    );

    expect(response.status).toBe(200);
    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({ id: challenge.userId }),
      expect.objectContaining({
        address: account.address,
        public_key: account.publicKey,
        wallet_type: "EVM",
        signature,
      }),
    );
  });

  it("keeps a non-EVM public key from the request", async () => {
    const challengeResponse = await loader(loaderArgs("near.testnet", "NEAR"));
    const challenge = await challengeResponse.json();

    const response = await action(
      actionArgs(
        createJsonRequest("http://localhost/api/profile", {
          method: "POST",
          headers: { Cookie: getSetCookieHeader(challengeResponse) },
          body: {
            recipientEncryptionPublicKey: "recipient-key",
            encryptionPasswordStore: "user",
            walletType: "NEAR",
            walletAddress: "near.testnet",
            walletPublicKey: "ed25519:NearPublicKey",
            signature: "near-sig",
          },
        }),
      ),
    );

    expect(response.status).toBe(200);
    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({ id: challenge.userId }),
      expect.objectContaining({
        public_key: "ed25519:NearPublicKey",
        wallet_type: "NEAR",
      }),
    );
  });
});
