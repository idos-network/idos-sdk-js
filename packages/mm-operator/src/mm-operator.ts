import type { SignKeyPair } from "tweetnacl";

import {
  buildPreliminaryIDOSCredential,
  localCredentialBroaderMessageFor,
} from "@idos-network/credentials/utils";
import {
  createKgwAuthenticatedBlobGateway,
  createNodeKwilClient,
  createServerKwilSigner,
  type KwilActionClient,
} from "@idos-network/kwil-infra";
import {
  createPreliminaryCredentialAsMmOperator,
  createUserAsMmOperator,
  type GetCredentialsAsMmOperatorOutput,
  getCredentialsAsMmOperator,
  getUserAsMmOperator,
  requestUserWipeAsMmOperator,
} from "@idos-network/kwil-infra/actions";
import {
  type BlobGateway,
  BlobGatewayUploadOutcomeUnknownError,
  decodeUkycStorageToken,
  normalizeUkycStorageToken,
} from "@idos-network/utils/blob-gateway";
import { base64Decode, hexEncodeSha256Hash } from "@idos-network/utils/codecs";

/** A credential row of an MM user, as `get_credentials_as_mm_operator` returns it. */
export type MmCredentialRow = GetCredentialsAsMmOperatorOutput;

export type MmUser = {
  id: string;
  recipientEncryptionPublicKey: string;
  /** A data wipe was requested: no reads, no new credentials until the wipe finishes. */
  frozen: boolean;
};

export type idOSMmOperatorParams = {
  nodeUrl: string;
  /** Defaults to `nodeUrl`. */
  blobGatewayUrl?: string;
  /** The MM operator's ed25519 delegate key. Signs Kwil calls and the KGW login. */
  signingKeyPair: SignKeyPair;
  chainId?: string;
};

export type CreateMmUserParams = {
  id: string;
  /** base64 nacl box public key the user's credentials are encrypted to. */
  recipientEncryptionPublicKey: string;
  walletId: string;
  /**
   * The user's UKYC storage token with the `write` operation. Its `signing_public_key`
   * becomes the user's MM wallet key.
   */
  storageToken: string;
};

export type GetMmCredentialsParams = {
  userId: string;
  /** The user's UKYC storage token with the `read` operation, for the user's storage. */
  storageToken: string;
};

export type CreateMmCredentialParams = {
  userId: string;
  /** The user's UKYC storage token with the `write` operation. */
  storageToken: string;
  publicNotes: string;
  plaintextContent: Uint8Array;
  /** ed25519 secret key (64 bytes) of the issuer that signs the credential. */
  issuerAuthSecretKey: Uint8Array;
};

export type GetMmCredentialContentParams = {
  credentialId: string;
  /** The user's UKYC storage token with the `read` operation. */
  storageToken: string;
};

export type RequestMmUserWipeParams = {
  userId: string;
  /** The user's UKYC storage token with the `delete` operation, for the user's storage. */
  deleteToken: string;
};

export type WipeMmUserParams = {
  /**
   * The user you expect the token to name. When given, a token of another user is refused with
   * `STORAGE_TOKEN_USER_MISMATCH`. Omit it to wipe whichever user the token names.
   */
  userId?: string;
  /** The user's UKYC storage token with the `delete` operation. */
  deleteToken: string;
};

export type idOSMmOperatorErrorCode =
  /** No MM user this operator manages has the storage token's key. */
  | "USER_NOT_FOUND"
  /** The storage token's `signing_public_key` isn't the MM wallet key of `userId`. */
  | "STORAGE_TOKEN_USER_MISMATCH"
  /**
   * Kwil rejected the storage token itself (malformed, bad signature, expired, or missing the
   * operation the action needs). Get a new token from the user's app.
   */
  | "STORAGE_TOKEN_INVALID"
  /**
   * The storage token's storage isn't the user's storage (the storage of the user's first
   * `ukyc://` credential). Get a token for the user's storage.
   */
  | "STORAGE_MISMATCH"
  /** A data wipe was requested for the user; it is frozen. */
  | "USER_WIPE_IN_PROGRESS"
  /** The user has no credential with that id. */
  | "CREDENTIAL_NOT_FOUND";

export class idOSMmOperatorError extends Error {
  constructor(
    public readonly code: idOSMmOperatorErrorCode,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "idOSMmOperatorError";
  }
}

/**
 * The MM operator: the only actor that creates MetaMask (MM) users, reads and writes their
 * `ukyc://` credentials, and wipes them. It signs Kwil calls with its delegate key (an
 * inserter listed in `mm_operators`) and reaches blob-gateway with a KGW session of the same
 * key plus the user's UKYC storage token.
 */
export class idOSMmOperator {
  readonly #kwilClient: KwilActionClient;
  readonly #blobGateway: BlobGateway;

  static async init(params: idOSMmOperatorParams): Promise<idOSMmOperator> {
    const kwilClient = await createNodeKwilClient({
      nodeUrl: params.nodeUrl,
      chainId: params.chainId,
    });

    // The MM operator views reject bad tokens with error(); without this they'd read as `[]`.
    kwilClient.throwOnCallError = true;

    const [signer] = await createServerKwilSigner(params.signingKeyPair);
    kwilClient.setSigner(signer);

    const blobGateway = createKgwAuthenticatedBlobGateway({
      url: params.blobGatewayUrl ?? params.nodeUrl,
      kwilClient,
      signer,
    });

    return new idOSMmOperator(kwilClient, blobGateway);
  }

  private constructor(kwilClient: KwilActionClient, blobGateway: BlobGateway) {
    this.#kwilClient = kwilClient;
    this.#blobGateway = blobGateway;
  }

  /**
   * The MM user whose MM wallet key is the storage token's `signing_public_key`, if this
   * operator manages it. Any valid token of the user works, including a delete-only one.
   */
  async getUser(storageToken: string): Promise<MmUser | null> {
    const [row] = await kwil(() =>
      getUserAsMmOperator(this.#kwilClient, {
        storage_token: normalizeUkycStorageToken(storageToken),
      }),
    );
    if (!row) return null;
    return {
      id: row.id,
      recipientEncryptionPublicKey: row.recipient_encryption_public_key,
      frozen: row.frozen,
    };
  }

  /**
   * Creates the user and its MM wallet (key = the `write` token's `signing_public_key`) in one
   * transaction. Fails if the MM key exists.
   */
  async createUser(params: CreateMmUserParams): Promise<void> {
    await kwil(() =>
      createUserAsMmOperator(this.#kwilClient, {
        id: params.id,
        recipient_encryption_public_key: params.recipientEncryptionPublicKey,
        wallet_id: params.walletId,
        storage_token: normalizeUkycStorageToken(params.storageToken),
      }),
    );
  }

  /** Credential metadata of a managed user (needs a `read` token). Empty while frozen. */
  async getCredentials(params: GetMmCredentialsParams): Promise<MmCredentialRow[]> {
    return kwil(() =>
      getCredentialsAsMmOperator(this.#kwilClient, {
        user_id: params.userId,
        storage_token: normalizeUkycStorageToken(params.storageToken),
      }),
    );
  }

  /**
   * Encrypts `plaintextContent` to the user's encryption key, stores it in the user's UKYC
   * storage as `ukyc://<storage_id>/blobs/<sha256(ciphertext)>` and resolves once blob-gateway
   * has finalized the credential. The token goes to Kwil (staging) and to blob-gateway (upload).
   *
   * If the upload outcome is unknown, the credential is looked up with the same token (this
   * needs the `read` operation too): a finalized row with this id and content URI (which pins
   * the ciphertext hash) counts as success; otherwise `BlobGatewayUploadOutcomeUnknownError` is
   * rethrown.
   */
  async createCredential(params: CreateMmCredentialParams): Promise<{ id: string }> {
    const token = decodeUkycStorageToken(params.storageToken);
    const user = await this.#requireUserForToken(params.userId, params.storageToken);
    if (user.frozen) {
      throw wipeInProgress(params.userId);
    }

    const credentialId = crypto.randomUUID();
    const requestId = crypto.randomUUID();
    const credential = await buildPreliminaryIDOSCredential({
      publicNotes: params.publicNotes,
      plaintextContent: params.plaintextContent,
      recipientEncryptionPublicKey: base64Decode(user.recipientEncryptionPublicKey),
      // The MM wallet is the recipient: MM users never sign, so there is no @caller wallet.
      // Kwil checked in getUser that the token's key is this user's MM wallet.
      broaderMessageFor: localCredentialBroaderMessageFor(
        token.signing_public_key,
        this.#kwilClient.chainId,
      ),
      issuerSigningSecretKey: params.issuerAuthSecretKey,
      ukycStorageId: token.storage_id,
    });

    await kwil(() =>
      createPreliminaryCredentialAsMmOperator(this.#kwilClient, {
        request_id: requestId,
        user_id: params.userId,
        credential_id: credentialId,
        issuer_auth_public_key: credential.issuerAuthPublicKey,
        encryptor_public_key: credential.encryptorPublicKey,
        content_uri: credential.contentUri,
        content_size: credential.contentSize,
        content_hash: hexEncodeSha256Hash(params.plaintextContent),
        public_notes: credential.publicNotes,
        public_notes_signature: credential.publicNotesSignature,
        broader_signature: credential.broaderSignature,
        storage_token: normalizeUkycStorageToken(params.storageToken),
      }),
    );

    try {
      await this.#blobGateway.withAccessToken(params.storageToken).uploadCredentialBlobs({
        requestId,
        credentialIds: [credentialId],
        original: credential.encryptedContent,
      });
    } catch (error) {
      if (!(error instanceof BlobGatewayUploadOutcomeUnknownError)) throw error;

      const stored = await this.getCredentials({
        userId: params.userId,
        storageToken: params.storageToken,
      })
        .then((rows) => rows.find((row) => row.id === credentialId))
        .catch(() => undefined);
      if (stored?.content_uri !== credential.contentUri) throw error;
    }

    return { id: credentialId };
  }

  /**
   * The credential's ciphertext from UKYC (checked against the content URI and size) and the
   * encryptor public key (base64) needed to decrypt it with the user's encryption key. The
   * `read` token selects the user and goes to Kwil (metadata) and blob-gateway (content).
   */
  async getCredentialContent(
    params: GetMmCredentialContentParams,
  ): Promise<{ ciphertext: Uint8Array; encryptorPublicKey: string }> {
    const user = await this.getUser(params.storageToken);
    if (!user) {
      throw new idOSMmOperatorError(
        "USER_NOT_FOUND",
        "no MM user managed by this operator has the storage token's key",
      );
    }
    if (user.frozen) {
      throw wipeInProgress(user.id);
    }

    const credential = (
      await this.getCredentials({ userId: user.id, storageToken: params.storageToken })
    ).find((row) => row.id === params.credentialId);
    if (!credential) {
      throw new idOSMmOperatorError(
        "CREDENTIAL_NOT_FOUND",
        `credential ${params.credentialId} not found for the storage token's user`,
      );
    }

    const ciphertext = await this.#blobGateway.withAccessToken(params.storageToken).fetchBlob({
      credentialId: credential.id,
      contentUri: credential.content_uri,
      expectedSize: credential.content_size,
    });

    return { ciphertext, encryptorPublicKey: credential.encryptor_public_key };
  }

  /**
   * Freezes the user for a data wipe (needs a `delete` token for the user's storage). A no-op
   * when it is already frozen; the token is checked anyway. No cancel.
   */
  async requestUserWipe(params: RequestMmUserWipeParams): Promise<void> {
    await kwil(() =>
      requestUserWipeAsMmOperator(this.#kwilClient, {
        user_id: params.userId,
        storage_token: normalizeUkycStorageToken(params.deleteToken),
      }),
    );
  }

  /**
   * Deletes the user's UKYC storage and then the idOS user (with its wallets and credentials):
   * looks the user up with `getUser(deleteToken)`, calls `requestUserWipe` unless it is
   * already frozen, then blob-gateway `DELETE /blob/v1/storage`. Run it as a retried job: on
   * failure the user stays frozen and consistent.
   *
   * Safe to repeat, also after the user is gone. When idOS has no MM user for the token's key
   * (never created, or already wiped: a wipe leaves no trace, so the two look the same), it goes
   * straight to blob-gateway, which answers 204 without touching UKYC, and the call succeeds:
   * idOS holds nothing for that key. `userId` can't be checked then, because every lookup by
   * user id needs a token of that user. Another operator's user gets 403 `WIPE_FORBIDDEN`.
   */
  async wipeUser(params: WipeMmUserParams): Promise<void> {
    const user = await this.getUser(params.deleteToken);

    if (user) {
      if (params.userId !== undefined && user.id !== params.userId) {
        throw tokenUserMismatch(params.userId);
      }
      if (!user.frozen) {
        await this.requestUserWipe({ userId: user.id, deleteToken: params.deleteToken });
      }
    }

    await this.#blobGateway.withAccessToken(params.deleteToken).deleteStorage();
  }

  async #requireUserForToken(userId: string, storageToken: string): Promise<MmUser> {
    const user = await this.getUser(storageToken);
    if (!user) {
      throw new idOSMmOperatorError(
        "USER_NOT_FOUND",
        "no MM user managed by this operator has the storage token's key",
      );
    }
    if (user.id !== userId) throw tokenUserMismatch(userId);
    return user;
  }
}

/**
 * Schema / kwild errors (in the call error or the failed transaction's log) that get an
 * `idOSMmOperatorError` code. Other Kwil errors propagate unchanged.
 */
const KWIL_ERROR_CODES: [RegExp, idOSMmOperatorErrorCode][] = [
  // idos.verify_storage_token: "storage token: expired", "storage token: missing the read
  // operation", "storage token: <reason>".
  [/storage token: /, "STORAGE_TOKEN_INVALID"],
  [/storage token does not belong to the user/, "STORAGE_TOKEN_USER_MISMATCH"],
  [
    /storage token does not match the user storage|credential storage does not match the (user storage|storage token)/,
    "STORAGE_MISMATCH",
  ],
  [/user data wipe is in progress/, "USER_WIPE_IN_PROGRESS"],
];

async function kwil<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const match = KWIL_ERROR_CODES.find(([pattern]) => pattern.test(message));
    if (!match) throw error;
    throw new idOSMmOperatorError(match[1], message, { cause: error });
  }
}

function wipeInProgress(userId: string): idOSMmOperatorError {
  return new idOSMmOperatorError(
    "USER_WIPE_IN_PROGRESS",
    `user ${userId} is frozen: a data wipe is in progress`,
  );
}

function tokenUserMismatch(userId: string): idOSMmOperatorError {
  return new idOSMmOperatorError(
    "STORAGE_TOKEN_USER_MISMATCH",
    `the storage token does not belong to user ${userId}`,
  );
}
