import {
  base64Encode,
  buildInsertableIDOSCredential,
  hexEncodeSha256Hash,
  type idOSCredential,
  utf8Encode,
} from "@idos-network/core";
import type { Auth } from "./auth";
import type { Enclave } from "./enclave";
import type { KwilWrapper } from "./kwil-wrapper";

// cspell:words idOSDAG
interface idOSDAGWithSignature {
  dag_owner_wallet_identifier: string;
  dag_grantee_wallet_identifier: string;
  dag_data_id: string;
  dag_locked_until: number;
  dag_content_hash: string;
  dag_signature: string;
}

interface idOSDAGSignatureRequest {
  dag_owner_wallet_identifier: string;
  dag_grantee_wallet_identifier: string;
  dag_data_id: string;
  dag_locked_until: number;
  dag_content_hash: string;
}

interface idOSDelegatedWriteGrantSignatureRequest {
  owner_wallet_identifier: string;
  grantee_wallet_identifier: string;
  issuer_public_key: string;
  id: string;
  access_grant_timelock: string;
  not_usable_before: string;
  not_usable_after: string;
}

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
    private readonly auth: Auth,
  ) {}

  singularize(tableName: string): string {
    return tableName.replace(/s$/, "");
  }

  async list<T extends AnyRecord>(tableName: string, filter?: Partial<T>): Promise<T[]> {
    let records = (await this.kwilWrapper.call(
      `get_${tableName}`,
      null,
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
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    )) as any;
  }

  async createMultiple<T extends AnyRecord>(
    tableName: string,
    records: T[],
    synchronous?: boolean,
  ) {
    let recipientEncryptionPublicKey: string | undefined;

    if (tableName === "credentials") {
      recipientEncryptionPublicKey ??= base64Encode(await this.enclave.ready(this.auth));
      if (!recipientEncryptionPublicKey) throw new Error("Missing recipientEncryptionPublicKey");
      for (const record of records) {
        Object.assign(
          record,
          await this.buildInsertableIDOSCredential(
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
    let recipientEncryptionPublicKey: string | undefined;

    if (tableName === "credentials") {
      recipientEncryptionPublicKey ??= base64Encode(await this.enclave.ready(this.auth));
      if (!recipientEncryptionPublicKey) throw new Error("Missing recipientEncryptionPublicKey");
      Object.assign(
        record,
        await this.buildInsertableIDOSCredential(
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
        // biome-ignore lint/suspicious/noExplicitAny: using any to avoid type errors for now.
      )) as any;

      const record = records.find((r: { id: string }) => r.id === recordId);

      if (!record) return null;

      if (decrypt) {
        await this.enclave.ready(this.auth);
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
        // biome-ignore lint/suspicious/noExplicitAny: using any to avoid type errors for now.
      )) as any;

      const record = records.find((r: { id: string }) => r.id === recordId);

      if (!record) return null;

      if (decrypt) {
        await this.enclave.ready(this.auth);
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
    if (!this.enclave.userEncryptionPublicKey) await this.enclave.ready(this.auth);

    let recipientEncryptionPublicKey: string | undefined;
    // biome-ignore lint/suspicious/noExplicitAny: using any to avoid type errors for now.
    const record: any = recordLike;

    if (tableName === "credentials") {
      recipientEncryptionPublicKey ??= base64Encode(await this.enclave.ready(this.auth));
      if (!recipientEncryptionPublicKey) throw new Error("Missing recipientEncryptionPublicKey");

      Object.assign(
        record,
        await this.buildInsertableIDOSCredential(
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
    consumerRecipientEncryptionPublicKey: string,
    grantInfo?: {
      consumerAddress: string;
      lockedUntil: number;
    },
    synchronous?: boolean,
  ): Promise<{ id: string }> {
    const originalCredential = (await this.get("credentials", recordId)) as idOSCredential;

    const insertableCredential = await this.buildInsertableIDOSCredential(
      originalCredential.user_id,
      "",
      originalCredential.content,
      consumerRecipientEncryptionPublicKey,
    );

    const id = crypto.randomUUID();

    await this.kwilWrapper.execute(
      "create_credential_copy",
      [
        {
          original_credential_id: originalCredential.id,
          ...originalCredential,
          ...insertableCredential,
          locked_until: grantInfo?.lockedUntil,
          grantee_wallet_identifier: grantInfo?.consumerAddress,
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
    consumerRecipientEncryptionPublicKey: string,
    grantInfo?: {
      consumerAddress: string;
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
        await this.buildInsertableIDOSCredential(
          record.user_id,
          "",
          record.content,
          consumerRecipientEncryptionPublicKey,
        ),
        {
          locked_until: grantInfo?.lockedUntil,
          grantee_wallet_identifier: grantInfo?.consumerAddress,
        },
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

  async getCredentialContentSha256Hash(credentialId: string) {
    const credential = (await this.get("credentials", credentialId)) as idOSCredential;
    return hexEncodeSha256Hash(utf8Encode(credential.content));
  }

  /**
   * Transmit a DAG to the given URL.
   * @param url The URL to transmit the DAG to.
   * @param payload The DAG to transmit.
   * @returns The response from the URL.
   */
  async transmitDAG(url: string, payload: idOSDAGWithSignature) {
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  }

  async requestDAGMessage(dag: idOSDAGSignatureRequest): Promise<string> {
    const response = (await this.kwilWrapper.call("dag_message", dag)) as unknown as [
      { message: string },
    ];
    const message = response?.[0]?.message;
    return message;
  }

  async requestDWGMessage(dwg: idOSDelegatedWriteGrantSignatureRequest): Promise<string> {
    const response = (await this.kwilWrapper.call("dwg_message", dwg)) as unknown as [
      { message: string },
    ];
    const message = response?.[0]?.message;
    return message;
  }

  async buildInsertableIDOSCredential(
    userId: string,
    publicNotes: string,
    plaintextContent: string,
    receiverEncryptionPublicKey: string,
  ): Promise<InsertableIDOSCredential> {
    const { content, encryptorPublicKey } = await this.enclave.encrypt(
      plaintextContent,
      receiverEncryptionPublicKey,
    );

    return buildInsertableIDOSCredential(
      userId,
      publicNotes,
      content,
      receiverEncryptionPublicKey,
      encryptorPublicKey,
    );
  }
}
