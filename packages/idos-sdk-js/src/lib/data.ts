import {
  base64Decode,
  base64Encode,
  hexEncode,
  sha256Hash,
  utf8Encode,
} from "@idos-network/codecs";
import type { idOSCredential } from "@idos-network/idos-sdk-types";
import nacl from "tweetnacl";
import type { Enclave } from "./enclave";
import type { KwilWrapper } from "./kwil-wrapper";

/* global crypto */

// biome-ignore lint/suspicious/noExplicitAny: using any to avoid type errors for now.
type AnyRecord = Record<string, any>;

type InsertableIDOSCredential = Omit<idOSCredential, "id" | "original_id"> & {
  public_notes_signature: string;
  broader_signature: string;
};

export class Data {
  constructor(
    public readonly kwilWrapper: KwilWrapper,
    public readonly enclave: Enclave,
  ) {}

  singularize(tableName: string): string {
    return tableName.replace(/s$/, "");
  }

  async list<T extends AnyRecord>(tableName: string, filter?: Partial<T>): Promise<T[]> {
    let records = (await this.kwilWrapper.call(
      `get_${tableName}`,
      null,
      `List your ${tableName} in idOS`,
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    )) as any;

    if (tableName === "credentials") {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      records = records.filter((record: any) => !record.original_id);
    }

    if (!filter) {
      return records;
    }

    const [key, value] = Object.entries(filter)[0];
    return records.filter((record: AnyRecord) => !record[key] || record[key] === value);
  }

  async listAllCredentials(): Promise<Record<string, string>[]> {
    const tableName = "credentials";
    return (await this.kwilWrapper.call(
      `get_${tableName}`,
      null,
      `List your ${tableName} in idOS`,
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    )) as any;
  }

  async listCredentialsFilteredByCountries(countries: string[]) {
    const credentials = await this.list("credentials");

    const credentialsWithContent = (
      await Promise.all(
        credentials.map(async (credential) => {
          return await this.get("credentials", credential.id as string, false);
        }),
      )
    ).filter((o) => o !== null) as Record<string, string>[];

    if (!credentialsWithContent.length) return [];

    return this.enclave.filterCredentialsByCountries(credentialsWithContent, countries);
  }

  async createMultiple<T extends AnyRecord>(
    tableName: string,
    records: T[],
    synchronous?: boolean,
  ) {
    let recipientEncryptionPublicKey: string | undefined;

    if (tableName === "credentials") {
      recipientEncryptionPublicKey ??= base64Encode(await this.enclave.ready());
      if (!recipientEncryptionPublicKey) throw new Error("Missing recipientEncryptionPublicKey");
      for (const record of records) {
        Object.assign(
          record,
          await this.#buildInsertableIDOSCredential(
            record.user_id,
            record.public_notes,
            record.content,
            recipientEncryptionPublicKey,
          ),
        );
      }
    }

    const newRecords = records.map((record) => ({
      id: crypto.randomUUID(),
      ...record,
    }));
    await this.kwilWrapper.execute(
      `add_${this.singularize(tableName)}`,
      newRecords,
      `Create new ${this.singularize(tableName)} in your idOS profile`,
      synchronous,
    );

    return newRecords;
  }

  async create<T extends { id: string }>(
    tableName: string,
    record: Omit<T, "id">,
    synchronous?: boolean,
  ): Promise<Omit<T, "id"> & { id: string }> {
    const name = `add_${this.singularize(
      tableName === "user_attributes" ? "attributes" : tableName,
    )}`;

    let recipientEncryptionPublicKey: string | undefined;

    const inputs: string[] = ((await this.kwilWrapper.schema) as AnyRecord).data.actions
      .find((action: AnyRecord) => action.name === name)
      .parameters.map((input: string) => input.substring(1));

    const recordKeys = Object.keys(record);

    if (inputs.every((input) => recordKeys.includes(input))) {
      throw new Error(`Invalid payload for action ${name}`);
    }

    if (tableName === "credentials") {
      recipientEncryptionPublicKey ??= base64Encode(await this.enclave.ready());
      if (!recipientEncryptionPublicKey) throw new Error("Missing recipientEncryptionPublicKey");
      Object.assign(
        record,
        await this.#buildInsertableIDOSCredential(
          (record as AnyRecord).user_id,
          (record as AnyRecord).public_notes,
          (record as AnyRecord).content,
          recipientEncryptionPublicKey,
        ),
      );
    }

    const newRecord = { id: crypto.randomUUID(), ...record };
    await this.kwilWrapper.execute(
      `add_${this.singularize(tableName)}`,
      [newRecord],
      `Create new ${this.singularize(tableName)} in your idOS profile`,
      synchronous,
    );

    return newRecord;
  }

  async get<T extends AnyRecord>(
    tableName: string,
    recordId: string,
    decrypt = true,
  ): Promise<T | null> {
    if (tableName === "credentials") {
      const records = (await this.kwilWrapper.call(
        "get_credential_owned",
        { id: recordId },
        "Get your credential in idOS",
        // biome-ignore lint/suspicious/noExplicitAny: using any to avoid type errors for now.
      )) as any;

      const record = records.find((r: { id: string }) => r.id === recordId);

      if (!record) return null;

      if (decrypt) {
        record.content = await this.enclave.decrypt(record.content, record.encryptor_public_key);
      }

      return record;
    }

    const records = await this.list<T & { id: string }>(tableName, <T & { id: string }>{
      id: recordId,
    });
    const record = records.find((r) => r.id === recordId);

    return record || null;
  }

  async getShared<T extends AnyRecord>(
    tableName: string,
    recordId: string,
    decrypt = true,
  ): Promise<T | null> {
    if (tableName === "credentials") {
      const records = (await this.kwilWrapper.call(
        "get_credential_shared",
        { id: recordId },
        "Get credential shared with you in idOS",
        // biome-ignore lint/suspicious/noExplicitAny: using any to avoid type errors for now.
      )) as any;

      const record = records.find((r: { id: string }) => r.id === recordId);

      if (!record) return null;

      if (decrypt) {
        record.content = await this.enclave.decrypt(record.content, record.encryptor_public_key);
      }

      return record;
    }

    const records = await this.list<T & { id: string }>(tableName, <T & { id: string }>{
      id: recordId,
    });

    const record = records.find((r) => r.id === recordId);

    return record || null;
  }

  async deleteMultiple(
    tableName: string,
    recordIds: string[],
    description?: string,
    synchronous?: boolean,
  ): Promise<{ id: string }[]> {
    const records = recordIds.map((id) => ({ id }));
    await this.kwilWrapper.execute(
      `remove_${this.singularize(tableName)}`,
      records,
      description,
      synchronous,
    );

    return records;
  }

  async delete(
    tableName: string,
    recordId: string,
    description?: string,
    synchronous?: boolean,
  ): Promise<{ id: string }> {
    const record = { id: recordId };
    await this.kwilWrapper.execute(
      `remove_${this.singularize(tableName)}`,
      [record],
      description,
      synchronous,
    );

    return record;
  }

  async update<T extends AnyRecord>(
    tableName: string,
    recordLike: T,
    description?: string,
    synchronous?: boolean,
  ): Promise<T> {
    if (!this.enclave.userEncryptionPublicKey) await this.enclave.ready();

    let recipientEncryptionPublicKey: string | undefined;
    // biome-ignore lint/suspicious/noExplicitAny: using any to avoid type errors for now.
    const record: any = recordLike;

    if (tableName === "credentials") {
      recipientEncryptionPublicKey ??= base64Encode(await this.enclave.ready());
      if (!recipientEncryptionPublicKey) throw new Error("Missing recipientEncryptionPublicKey");

      Object.assign(
        record,
        await this.#buildInsertableIDOSCredential(
          record.user_id,
          record.public_notes,
          record.content,
          recipientEncryptionPublicKey,
        ),
      );
    }

    await this.kwilWrapper.execute(
      `edit_${this.singularize(tableName)}`,
      [record],
      description,
      synchronous,
    );

    return record;
  }

  // This is the same as `share`, but for credentials only. It doesn't create an AG either for the duplicate.
  async shareCredential(
    recordId: string,
    granteeRecipientEncryptionPublicKey: string,
    grantInfo?: {
      granteeAddress: string;
      lockedUntil: number;
    },
    synchronous?: boolean,
  ): Promise<{ id: string }> {
    const originalCredential = (await this.get("credentials", recordId)) as idOSCredential;

    const insertableCredential = await this.#buildInsertableIDOSCredential(
      originalCredential.user_id,
      "",
      originalCredential.content,
      granteeRecipientEncryptionPublicKey,
      grantInfo,
    );

    const id = crypto.randomUUID();

    await this.kwilWrapper.execute(
      "share_credential_without_ag",
      [
        {
          original_credential_id: originalCredential.id,
          ...originalCredential,
          ...insertableCredential,
          id,
        },
      ],
      "Share a credential on idOS",
      synchronous,
    );

    return { id };
  }

  async share(
    tableName: string,
    recordId: string,
    granteeRecipientEncryptionPublicKey: string,
    grantInfo?: {
      granteeAddress: string;
      lockedUntil: number;
    },
    synchronous?: boolean,
  ): Promise<{ id: string }> {
    const name = this.singularize(tableName);

    // biome-ignore lint/suspicious/noExplicitAny: TBD
    const record = (await this.get(tableName, recordId)) as any;

    if (tableName === "credentials") {
      Object.assign(
        record,
        await this.#buildInsertableIDOSCredential(
          record.user_id,
          "",
          record.content,
          granteeRecipientEncryptionPublicKey,
          grantInfo,
        ),
      );
    }

    const id = crypto.randomUUID();

    await this.kwilWrapper.execute(
      `share_${name}`,
      [
        {
          [`original_${name}_id`]: record.id,
          ...record,
          id,
        },
      ],
      `Share a ${name} on idOS`,
      synchronous,
    );

    return { id };
  }

  async unshare(
    tableName: string,
    recordId: string,
    synchronous?: boolean,
  ): Promise<{ id: string }> {
    return await this.delete(tableName, recordId, undefined, synchronous);
  }

  async addWriteGrant(granteeAddress: string, synchronous?: boolean) {
    return await this.kwilWrapper.execute(
      "add_write_grant",
      [
        {
          wg_grantee_wallet_identifier: granteeAddress,
        },
      ],
      `Grant ${granteeAddress} write access to your idOS credentials`,
      synchronous,
    );
  }

  async hasWriteGrantGivenBy(userId: string) {
    return await this.kwilWrapper.call("has_write_grant_given_by", { user_id: userId });
  }

  async hasWriteGrantGivenTo(granteeAddress: string) {
    return await this.kwilWrapper.call("has_write_grant_given_to", {
      wg_grantee_wallet_identifier: granteeAddress,
    });
  }

  async getCredentialContentSha256Hash(credentialId: string) {
    const credential = (await this.get("credentials", credentialId)) as idOSCredential;
    const encodedContent = new TextEncoder().encode(credential.content);
    return hexEncode(sha256Hash(encodedContent), true);
  }

  async #buildInsertableIDOSCredential(
    userId: string,
    publicNotes: string,
    plaintextContent: string,
    receiverEncryptionPublicKey: string | undefined,
    grantInfo?: {
      granteeAddress: string;
      lockedUntil: number;
    },
  ): Promise<InsertableIDOSCredential> {
    const issuerAuthenticationKeyPair = nacl.sign.keyPair();

    if (!receiverEncryptionPublicKey) throw new Error("Missing recipientEncryptionPublicKey");

    const { content, encryptorPublicKey } = await this.enclave.encrypt(
      plaintextContent,
      receiverEncryptionPublicKey,
    );
    const publicNotesSignature = nacl.sign.detached(
      utf8Encode(publicNotes),
      issuerAuthenticationKeyPair.secretKey,
    );

    const grantInfoParam = grantInfo
      ? {
          grantee_wallet_identifier: grantInfo.granteeAddress,
          locked_until: grantInfo.lockedUntil,
        }
      : {};

    return {
      user_id: userId,
      content,

      public_notes: publicNotes,
      public_notes_signature: base64Encode(publicNotesSignature),

      broader_signature: base64Encode(
        nacl.sign.detached(
          Uint8Array.from([...publicNotesSignature, ...base64Decode(content)]),
          issuerAuthenticationKeyPair.secretKey,
        ),
      ),

      issuer_auth_public_key: hexEncode(issuerAuthenticationKeyPair.publicKey, true),
      encryptor_public_key: isPresent(encryptorPublicKey),
      ...grantInfoParam,
    };
  }
}

const isPresent = <T>(obj: T | undefined | null): T => {
  // @todo: better error message.
  if (!obj) throw new Error("Unexpected absence");
  return obj;
};
