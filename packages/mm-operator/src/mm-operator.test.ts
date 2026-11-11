// @vitest-environment node

import { BlobGatewayHttpError } from "@idos-network/utils/blob-gateway";
import {
  base64Decode,
  base64Encode,
  base64UrlEncode,
  hexDecode,
  hexEncodeSha256Hash,
  utf8Encode,
} from "@idos-network/utils/codecs";
import nacl from "tweetnacl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { idOSMmOperator, idOSMmOperatorError } from "./index.js";

type Row = Record<string, unknown>;
type ActionCall = { name: string; inputs: Row };

const MM_KEY = base64UrlEncode(new Uint8Array(32).fill(7));
const OTHER_KEY = base64UrlEncode(new Uint8Array(32).fill(8));
const USER_ID = "00000000-0000-4000-8000-000000000001";
const userEncryption = nacl.box.keyPair();

const { state, kwilClient } = vi.hoisted(() => {
  const state = {
    users: [] as Row[],
    credentials: [] as Row[],
    calls: [] as { kind: "call" | "execute"; name: string; inputs: Row }[],
    failCall: undefined as undefined | ((name: string) => Error | undefined),
    /** Makes the Kwil client a real KwilActionClient over a node whose views report this error. */
    viewError: undefined as undefined | string,
    fetchFn: vi.fn<typeof fetch>(),
  };
  const kwilClient = {
    chainId: "test-chain",
    setSigner: vi.fn(),
    async call({ name, inputs }: ActionCall) {
      state.calls.push({ kind: "call", name, inputs });
      const failure = state.failCall?.(name);
      if (failure) throw failure;
      switch (name) {
        case "get_user_as_mm_operator": {
          // kwild verifies the token; the mock only reads its key.
          const key = tokenKey(inputs.storage_token);
          return state.users.filter((user) => user.mm_public_key === key);
        }
        case "get_credentials_as_mm_operator":
          return state.credentials.filter((row) => row.user_id === inputs.user_id);
        default:
          throw new Error(`unexpected call ${name}`);
      }
    },
    async execute({ name, inputs }: ActionCall) {
      state.calls.push({ kind: "execute", name, inputs });
      const failure = state.failCall?.(name);
      if (failure) throw failure;
      return "tx-hash";
    },
  };
  function tokenKey(token: unknown): unknown {
    const json = Buffer.from(String(token), "base64url").toString("utf8");
    return (JSON.parse(json) as { payload: { signing_public_key?: unknown } }).payload
      .signing_public_key;
  }
  return { state, kwilClient };
});

vi.mock("@idos-network/kwil-infra", async (importOriginal) => {
  const { BlobGateway: Gateway } = await import("@idos-network/utils/blob-gateway");
  const { KwilActionClient } = await importOriginal<typeof import("@idos-network/kwil-infra")>();
  return {
    createNodeKwilClient: vi.fn(async () =>
      state.viewError === undefined
        ? kwilClient
        : // kwild answers a view that fails in error() with HTTP 200 and `data.error`.
          Object.assign(
            new KwilActionClient({
              call: async () => ({ status: 200, data: { result: [], error: state.viewError } }),
            } as never),
            { setSigner: vi.fn() },
          ),
    ),
    createServerKwilSigner: vi.fn(async () => [{ signer: "operator" }, "operator-address"]),
    createKgwAuthenticatedBlobGateway: vi.fn(
      (params: { url: string }) =>
        new Gateway({ url: params.url, fetchFn: state.fetchFn, uploadRetries: 0 }),
    ),
  };
});

function storageToken(payload: Row = {}): string {
  return base64UrlEncode(
    utf8Encode(
      JSON.stringify({
        payload: { version: 1, storage_id: "storage-abc", signing_public_key: MM_KEY, ...payload },
        signature: base64UrlEncode(new Uint8Array(64).fill(9)),
      }),
    ),
  );
}

function mmUser(overrides: Row = {}): Row {
  return {
    id: USER_ID,
    recipient_encryption_public_key: base64Encode(userEncryption.publicKey),
    frozen: false,
    mm_public_key: MM_KEY,
    ...overrides,
  };
}

function executed(name: string): Row | undefined {
  return state.calls.find((call) => call.kind === "execute" && call.name === name)?.inputs;
}

function request(index = 0): { url: string; method: string; headers: Headers; body: unknown } {
  const [input, init] = state.fetchFn.mock.calls[index] ?? [];
  return {
    url: String(input),
    method: init?.method ?? "GET",
    headers: new Headers(init?.headers),
    body: init?.body,
  };
}

async function operator(): Promise<idOSMmOperator> {
  return idOSMmOperator.init({
    nodeUrl: "https://nodes.example",
    blobGatewayUrl: "https://blob.example",
    signingKeyPair: nacl.sign.keyPair(),
  });
}

const issuerKeyPair = nacl.sign.keyPair();

describe("idOSMmOperator", () => {
  beforeEach(() => {
    state.users = [mmUser()];
    state.credentials = [];
    state.calls = [];
    state.failCall = undefined;
    state.viewError = undefined;
    state.fetchFn.mockReset();
  });

  it("signs Kwil calls with the operator key and uses its KGW session for blob-gateway", async () => {
    const { createKgwAuthenticatedBlobGateway } = await import("@idos-network/kwil-infra");

    await operator();

    expect(kwilClient.setSigner).toHaveBeenCalledWith({ signer: "operator" });
    expect(createKgwAuthenticatedBlobGateway).toHaveBeenCalledWith({
      url: "https://blob.example",
      kwilClient,
      signer: { signer: "operator" },
    });
  });

  it("falls back to nodeUrl when blobGatewayUrl is omitted", async () => {
    const { createKgwAuthenticatedBlobGateway } = await import("@idos-network/kwil-infra");

    await idOSMmOperator.init({
      nodeUrl: "https://nodes.example",
      signingKeyPair: nacl.sign.keyPair(),
    });

    expect(createKgwAuthenticatedBlobGateway).toHaveBeenLastCalledWith({
      url: "https://nodes.example",
      kwilClient,
      signer: { signer: "operator" },
    });
  });

  describe("users", () => {
    it("looks the user up by a storage token and returns null otherwise", async () => {
      const op = await operator();
      const token = storageToken({ operations: ["delete"] });

      await expect(op.getUser(token)).resolves.toEqual({
        id: USER_ID,
        recipientEncryptionPublicKey: mmUser().recipient_encryption_public_key,
        frozen: false,
      });
      expect(state.calls[0]).toEqual({
        kind: "call",
        name: "get_user_as_mm_operator",
        inputs: { storage_token: token },
      });
      await expect(op.getUser(storageToken({ signing_public_key: OTHER_KEY }))).resolves.toBeNull();
    });

    it("sends Kwil the raw token when it carries an AccessToken or Bearer prefix", async () => {
      const op = await operator();
      const token = storageToken();
      state.credentials = [];

      await op.getUser(` AccessToken ${token}\n`);
      await op.createUser({
        id: "00000000-0000-4000-8000-000000000002",
        recipientEncryptionPublicKey: "enc-key",
        walletId: "00000000-0000-4000-8000-000000000003",
        storageToken: `Bearer ${token}`,
      });
      await op.getCredentials({ userId: USER_ID, storageToken: `bearer\t${token}` });
      await op.requestUserWipe({ userId: USER_ID, deleteToken: `AccessToken ${token}` });

      expect(state.calls.map((call) => call.inputs.storage_token)).toEqual([
        token,
        token,
        token,
        token,
      ]);
    });

    it("creates the user and its MM wallet in one action with the write token", async () => {
      const op = await operator();
      const token = storageToken();
      const params = {
        id: "00000000-0000-4000-8000-000000000002",
        recipientEncryptionPublicKey: "enc-key",
        walletId: "00000000-0000-4000-8000-000000000003",
        storageToken: token,
      };

      await op.createUser(params);

      expect(executed("create_user_as_mm_operator")).toEqual({
        id: params.id,
        recipient_encryption_public_key: "enc-key",
        wallet_id: params.walletId,
        storage_token: token,
      });
    });

    it("reads credentials with the user id and the read token", async () => {
      state.credentials = [{ id: "c1", user_id: USER_ID }];
      const token = storageToken({ operations: ["read"] });

      await expect(
        (await operator()).getCredentials({ userId: USER_ID, storageToken: token }),
      ).resolves.toEqual([{ id: "c1", user_id: USER_ID }]);
      expect(state.calls[0]?.inputs).toEqual({ user_id: USER_ID, storage_token: token });
    });

    it.each([
      ["storage token: expired", "STORAGE_TOKEN_INVALID"],
      ["storage token: missing the read operation", "STORAGE_TOKEN_INVALID"],
      ["storage token does not belong to the user", "STORAGE_TOKEN_USER_MISMATCH"],
      ["storage token does not match the user storage", "STORAGE_MISMATCH"],
      ["credential storage does not match the user storage", "STORAGE_MISMATCH"],
      ["user data wipe is in progress", "USER_WIPE_IN_PROGRESS"],
    ])("maps the Kwil error %j to %s", async (message, code) => {
      const cause = new Error(`call failed: ${message}`);
      state.failCall = () => cause;

      const error = await (
        await operator()
      )
        .getCredentials({ userId: USER_ID, storageToken: storageToken() })
        .catch((e: unknown) => e);
      expect(error).toBeInstanceOf(idOSMmOperatorError);
      expect(error).toMatchObject({ code, cause });
    });

    it("propagates other Kwil errors unchanged", async () => {
      const cause = new Error("the user is not managed by this MM operator");
      state.failCall = () => cause;

      await expect((await operator()).getUser(storageToken())).rejects.toBe(cause);
    });
  });

  describe("view actions that fail in error()", () => {
    // Kwil reports these as `data.error` of a successful HTTP call, not as an exception.
    const rejections: [string, string, string][] = [
      ["an expired token", "storage token: expired", "STORAGE_TOKEN_INVALID"],
      [
        "a token of another user",
        "storage token does not belong to the user",
        "STORAGE_TOKEN_USER_MISMATCH",
      ],
      [
        "a token of another storage",
        "storage token does not match the user storage",
        "STORAGE_MISMATCH",
      ],
    ];

    describe.each(rejections)("with %s", (_label, viewError, code) => {
      beforeEach(() => {
        state.viewError = viewError;
      });

      it("rejects getUser", async () => {
        await expect((await operator()).getUser(storageToken())).rejects.toMatchObject({
          name: "idOSMmOperatorError",
          code,
        });
      });

      it("rejects getCredentials instead of returning no credentials", async () => {
        await expect(
          (await operator()).getCredentials({ userId: USER_ID, storageToken: storageToken() }),
        ).rejects.toMatchObject({ name: "idOSMmOperatorError", code });
      });

      it("rejects getCredentialContent", async () => {
        await expect(
          (await operator()).getCredentialContent({
            credentialId: "00000000-0000-4000-8000-0000000000c1",
            storageToken: storageToken(),
          }),
        ).rejects.toMatchObject({ name: "idOSMmOperatorError", code });
      });
    });
  });

  describe("createCredential", () => {
    const plaintextContent = utf8Encode("kyc data");
    const publicNotes = JSON.stringify({ id: "vc-1" });

    function acceptUpload(): { uploaded: () => Uint8Array | undefined } {
      let uploaded: Uint8Array | undefined;
      state.fetchFn.mockImplementation(async (_input, init) => {
        const original = (init?.body as FormData | undefined)?.get("original");
        if (!(original instanceof Blob)) throw new Error("expected an original blob");
        uploaded = new Uint8Array(await original.arrayBuffer());
        return Response.json({ request_id: "ignored" });
      });
      return { uploaded: () => uploaded };
    }

    it("stages a ukyc:// credential signed for the MM wallet and uploads it with the token", async () => {
      const upload = acceptUpload();
      const token = storageToken();

      const op = await operator();
      const { id } = await op.createCredential({
        userId: USER_ID,
        storageToken: token,
        publicNotes,
        plaintextContent,
        issuerAuthSecretKey: issuerKeyPair.secretKey,
      });

      const staged = executed("create_preliminary_credential_as_mm_operator");
      const ciphertext = upload.uploaded();
      if (!ciphertext) throw new Error("nothing was uploaded");
      expect(staged).toMatchObject({
        storage_token: token,
        user_id: USER_ID,
        credential_id: id,
        content_uri: `ukyc://storage-abc/blobs/${hexEncodeSha256Hash(ciphertext)}`,
        content_size: ciphertext.byteLength,
        content_hash: hexEncodeSha256Hash(plaintextContent),
        public_notes: publicNotes,
        issuer_auth_public_key: Buffer.from(issuerKeyPair.publicKey).toString("hex"),
      });

      // Issuer signatures: built locally (no node call), bound to the user's MM key and the chain.
      expect(state.calls.map((c) => c.name)).not.toContain("credential_broader_message");
      const broaderMessage = [
        "operation: credential",
        `public notes signature: ${staged?.public_notes_signature}`,
        `content uri: ${staged?.content_uri}`,
        `recipient wallet: ${MM_KEY}`,
        "chain id: test-chain",
      ].join("\n");
      expect(
        nacl.sign.detached.verify(
          utf8Encode(broaderMessage),
          base64Decode(staged?.broader_signature as string),
          issuerKeyPair.publicKey,
        ),
      ).toBe(true);
      expect(
        nacl.sign.detached.verify(
          utf8Encode(publicNotes),
          base64Decode(staged?.public_notes_signature as string),
          hexDecode(staged?.issuer_auth_public_key as string),
        ),
      ).toBe(true);

      // Encrypted to the user's recipient key.
      const opened = nacl.box.open(
        ciphertext.slice(24),
        ciphertext.slice(0, 24),
        base64Decode(staged?.encryptor_public_key as string),
        userEncryption.secretKey,
      );
      expect(opened).toEqual(plaintextContent);

      const upl = request();
      expect(upl.url).toBe(
        `https://blob.example/blob/v1/requests/${staged?.request_id as string}/upload`,
      );
      expect(upl.headers.get("authorization")).toBe(`AccessToken ${token}`);
      expect(state.calls[0]).toMatchObject({
        name: "get_user_as_mm_operator",
        inputs: { storage_token: token },
      });
    });

    it("maps a Kwil storage rejection while staging", async () => {
      state.failCall = (name) =>
        name === "create_preliminary_credential_as_mm_operator"
          ? new Error("tx failed: credential storage does not match the user storage")
          : undefined;

      await expect(
        (await operator()).createCredential({
          userId: USER_ID,
          storageToken: storageToken({ storage_id: "storage-other" }),
          publicNotes,
          plaintextContent,
          issuerAuthSecretKey: issuerKeyPair.secretKey,
        }),
      ).rejects.toMatchObject({ code: "STORAGE_MISMATCH" });
      expect(state.fetchFn).not.toHaveBeenCalled();
    });

    it("refuses a token of another user before staging", async () => {
      state.users = [mmUser({ id: "00000000-0000-4000-8000-000000000009" })];

      await expect(
        (await operator()).createCredential({
          userId: USER_ID,
          storageToken: storageToken(),
          publicNotes,
          plaintextContent,
          issuerAuthSecretKey: issuerKeyPair.secretKey,
        }),
      ).rejects.toMatchObject({ code: "STORAGE_TOKEN_USER_MISMATCH" });
      expect(executed("create_preliminary_credential_as_mm_operator")).toBeUndefined();
    });

    it("refuses a frozen user before staging", async () => {
      state.users = [mmUser({ frozen: true })];

      const error = await (
        await operator()
      )
        .createCredential({
          userId: USER_ID,
          storageToken: storageToken(),
          publicNotes,
          plaintextContent,
          issuerAuthSecretKey: issuerKeyPair.secretKey,
        })
        .catch((e: unknown) => e);
      expect(error).toBeInstanceOf(idOSMmOperatorError);
      expect(error).toMatchObject({ code: "USER_WIPE_IN_PROGRESS" });
      expect(state.fetchFn).not.toHaveBeenCalled();
    });

    it("rejects a token without storage_id", async () => {
      await expect(
        (await operator()).createCredential({
          userId: USER_ID,
          storageToken: storageToken({ storage_id: undefined }),
          publicNotes,
          plaintextContent,
          issuerAuthSecretKey: issuerKeyPair.secretKey,
        }),
      ).rejects.toThrow(/storage_id/);
    });

    it("surfaces blob-gateway refusals as BlobGatewayHttpError", async () => {
      state.fetchFn.mockResolvedValue(
        Response.json({ error: "frozen", code: "USER_WIPE_IN_PROGRESS" }, { status: 409 }),
      );

      const error = await (
        await operator()
      )
        .createCredential({
          userId: USER_ID,
          storageToken: storageToken(),
          publicNotes,
          plaintextContent,
          issuerAuthSecretKey: issuerKeyPair.secretKey,
        })
        .catch((e: unknown) => e);
      expect(error).toBeInstanceOf(BlobGatewayHttpError);
      expect(error).toMatchObject({ status: 409, code: "USER_WIPE_IN_PROGRESS" });
    });

    it("resolves an unknown upload outcome when the finalized row has our content URI", async () => {
      state.fetchFn.mockRejectedValue(new TypeError("fetch failed"));
      state.failCall = (name) => {
        if (name !== "get_credentials_as_mm_operator") return undefined;
        const staged = executed("create_preliminary_credential_as_mm_operator");
        state.credentials = [
          { id: staged?.credential_id, user_id: USER_ID, content_uri: staged?.content_uri },
        ];
        return undefined;
      };

      const token = storageToken();
      const op = await operator();
      const { id } = await op.createCredential({
        userId: USER_ID,
        storageToken: token,
        publicNotes,
        plaintextContent,
        issuerAuthSecretKey: issuerKeyPair.secretKey,
      });

      expect(id).toBe(executed("create_preliminary_credential_as_mm_operator")?.credential_id);
      expect(
        state.calls.find((call) => call.name === "get_credentials_as_mm_operator")?.inputs,
      ).toEqual({ user_id: USER_ID, storage_token: token });
    });

    it("rethrows an unknown upload outcome when the credential isn't there", async () => {
      state.fetchFn.mockRejectedValue(new TypeError("fetch failed"));

      await expect(
        (await operator()).createCredential({
          userId: USER_ID,
          storageToken: storageToken(),
          publicNotes,
          plaintextContent,
          issuerAuthSecretKey: issuerKeyPair.secretKey,
        }),
      ).rejects.toMatchObject({ name: "BlobGatewayUploadOutcomeUnknownError" });
    });
  });

  describe("getCredentialContent", () => {
    const ciphertext = utf8Encode("ciphertext bytes");
    const credentialId = "00000000-0000-4000-8000-0000000000c1";

    beforeEach(() => {
      state.credentials = [
        {
          id: credentialId,
          user_id: USER_ID,
          content_uri: `ukyc://storage-abc/blobs/${hexEncodeSha256Hash(ciphertext)}`,
          content_size: ciphertext.byteLength,
          encryptor_public_key: "encryptor-key",
        },
      ];
    });

    it("reads the blob with the token and returns the encryptor key", async () => {
      state.fetchFn.mockResolvedValue(new Response(ciphertext.slice()));
      const token = storageToken();

      await expect(
        (await operator()).getCredentialContent({ credentialId, storageToken: token }),
      ).resolves.toEqual({ ciphertext, encryptorPublicKey: "encryptor-key" });

      expect(request().url).toBe(`https://blob.example/blob/v1/credentials/${credentialId}`);
      expect(request().headers.get("authorization")).toBe(`AccessToken ${token}`);
      expect(state.calls.map((call) => [call.name, call.inputs])).toEqual([
        ["get_user_as_mm_operator", { storage_token: token }],
        ["get_credentials_as_mm_operator", { user_id: USER_ID, storage_token: token }],
      ]);
    });

    it("rejects bytes that don't hash to the blob id", async () => {
      state.fetchFn.mockResolvedValue(new Response("tampered bytes!!"));

      await expect(
        (await operator()).getCredentialContent({ credentialId, storageToken: storageToken() }),
      ).rejects.toThrow(/sha256/);
    });

    it("reports a credential of another user as not found", async () => {
      await expect(
        (await operator()).getCredentialContent({
          credentialId: "00000000-0000-4000-8000-0000000000c2",
          storageToken: storageToken(),
        }),
      ).rejects.toMatchObject({ code: "CREDENTIAL_NOT_FOUND" });
      expect(state.fetchFn).not.toHaveBeenCalled();
    });

    it("reports an unknown token key as USER_NOT_FOUND", async () => {
      state.users = [];

      await expect(
        (await operator()).getCredentialContent({ credentialId, storageToken: storageToken() }),
      ).rejects.toMatchObject({ code: "USER_NOT_FOUND" });
    });
  });

  describe("wipe", () => {
    function storageDeleted(status = 204): void {
      state.fetchFn.mockResolvedValue(
        status === 204
          ? new Response(null, { status })
          : Response.json({ error: "x", code: "WIPE_NOT_REQUESTED" }, { status }),
      );
    }

    it("requests the wipe with the delete token", async () => {
      const token = storageToken({ operations: ["delete"] });

      await (await operator()).requestUserWipe({ userId: USER_ID, deleteToken: token });

      expect(executed("request_user_wipe_as_mm_operator")).toEqual({
        user_id: USER_ID,
        storage_token: token,
      });
    });

    it("freezes the user, then deletes the storage with the delete token", async () => {
      storageDeleted();
      const token = storageToken({ operations: ["delete"] });

      await (await operator()).wipeUser({ userId: USER_ID, deleteToken: token });

      expect(state.calls.map((call) => [call.name, call.inputs])).toEqual([
        ["get_user_as_mm_operator", { storage_token: token }],
        ["request_user_wipe_as_mm_operator", { user_id: USER_ID, storage_token: token }],
      ]);
      expect(request()).toMatchObject({
        url: "https://blob.example/blob/v1/storage",
        method: "DELETE",
      });
      expect(request().headers.get("authorization")).toBe(`AccessToken ${token}`);
    });

    it("wipes the user the token names when no userId is given", async () => {
      storageDeleted();
      const token = storageToken({ operations: ["delete"] });

      await (await operator()).wipeUser({ deleteToken: token });

      expect(executed("request_user_wipe_as_mm_operator")).toEqual({
        user_id: USER_ID,
        storage_token: token,
      });
      expect(request().method).toBe("DELETE");
    });

    it("skips the request for a frozen user", async () => {
      state.users = [mmUser({ frozen: true })];
      storageDeleted();

      await (await operator()).wipeUser({ userId: USER_ID, deleteToken: storageToken() });

      expect(executed("request_user_wipe_as_mm_operator")).toBeUndefined();
      expect(state.fetchFn).toHaveBeenCalledOnce();
    });

    it("finishes again after the user is gone", async () => {
      state.users = [];
      storageDeleted();

      await (await operator()).wipeUser({ userId: USER_ID, deleteToken: storageToken() });

      expect(executed("request_user_wipe_as_mm_operator")).toBeUndefined();
      expect(state.calls.map((call) => call.name)).toEqual(["get_user_as_mm_operator"]);
      expect(request().method).toBe("DELETE");
    });

    it("refuses a delete token of another user", async () => {
      state.users = [mmUser({ id: "00000000-0000-4000-8000-000000000009" })];

      await expect(
        (await operator()).wipeUser({ userId: USER_ID, deleteToken: storageToken() }),
      ).rejects.toMatchObject({ code: "STORAGE_TOKEN_USER_MISMATCH" });
      expect(executed("request_user_wipe_as_mm_operator")).toBeUndefined();
      expect(state.fetchFn).not.toHaveBeenCalled();
    });

    it("stops on a token Kwil rejects", async () => {
      state.failCall = (name) =>
        name === "get_user_as_mm_operator"
          ? new Error("call failed: storage token: expired")
          : undefined;

      await expect(
        (await operator()).wipeUser({ userId: USER_ID, deleteToken: storageToken() }),
      ).rejects.toMatchObject({ code: "STORAGE_TOKEN_INVALID" });
      expect(state.fetchFn).not.toHaveBeenCalled();
    });

    it("stops when the wipe request is rejected for another storage", async () => {
      state.failCall = (name) =>
        name === "request_user_wipe_as_mm_operator"
          ? new Error("tx failed: storage token does not match the user storage")
          : undefined;

      await expect(
        (await operator()).wipeUser({ userId: USER_ID, deleteToken: storageToken() }),
      ).rejects.toMatchObject({ code: "STORAGE_MISMATCH" });
      expect(state.fetchFn).not.toHaveBeenCalled();
    });

    it("surfaces the gateway's storage mismatch for a frozen user", async () => {
      state.users = [mmUser({ frozen: true })];
      state.fetchFn.mockResolvedValue(
        Response.json({ error: "x", code: "WIPE_STORAGE_MISMATCH" }, { status: 409 }),
      );

      await expect(
        (await operator()).wipeUser({ userId: USER_ID, deleteToken: storageToken() }),
      ).rejects.toMatchObject({ status: 409, code: "WIPE_STORAGE_MISMATCH" });
    });

    it("surfaces gateway wipe errors", async () => {
      storageDeleted(409);

      await expect(
        (await operator()).wipeUser({ userId: USER_ID, deleteToken: storageToken() }),
      ).rejects.toMatchObject({ status: 409, code: "WIPE_NOT_REQUESTED" });
    });
  });
});
