import type { idOSCredential2 } from "@idos-network/idos-sdk-types";
import * as Base64Codec from "@stablelib/base64";
import * as Utf8Codec from "@stablelib/utf8";
import nacl from "tweetnacl";
import type { Enclave } from "./enclave";
import type { KwilWrapper } from "./kwil-wrapper";
import { Nonce } from "./nonce";

/* global crypto */

// biome-ignore lint/suspicious/noExplicitAny: using any to avoid type errors for now.
type AnyRecord = Record<string, any>;

type InsertableIdosCredential2 = Omit<idOSCredential2, "id" | "original_id">;

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
    let receiverPublicKey: string | undefined;

    if (tableName === "credentials") {
      receiverPublicKey = receiverPublicKey ?? Base64Codec.encode(await this.enclave.ready());
      for (const record of records) {
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        (record as any).content = await this.enclave.encrypt(
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
          (record as any).content as string,
          receiverPublicKey,
        );
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        (record as any).encryption_public_key = receiverPublicKey;
      }
    }

    if (tableName === "credential2s") {
      receiverPublicKey = receiverPublicKey ?? Base64Codec.encode(await this.enclave.ready());
      for (const record of records) {
        Object.assign(
          record,
          await this.#buildInsertableIdosCredential2(
            record.human_id,
            record.public_notes,
            record.content,
            receiverPublicKey, // Encryption
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
      tableName === "human_attributes" ? "attributes" : tableName,
    )}`;

    let receiverPublicKey: string | undefined;

    const inputs: string[] = ((await this.kwilWrapper.schema) as AnyRecord).data.actions
      .find((action: AnyRecord) => action.name === name)
      .parameters.map((input: string) => input.substring(1));

    const recordKeys = Object.keys(record);

    if (inputs.every((input) => recordKeys.includes(input))) {
      throw new Error(`Invalid payload for action ${name}`);
    }

    if (tableName === "credentials") {
      receiverPublicKey ??= Base64Codec.encode(await this.enclave.ready());
      (record as AnyRecord).content = await this.enclave.encrypt(
        (record as AnyRecord).content as string,
        receiverPublicKey,
      );
      (record as AnyRecord).encryption_public_key = receiverPublicKey;
    }

    if (tableName === "credential2s") {
      receiverPublicKey ??= Base64Codec.encode(await this.enclave.ready());
      Object.assign(
        record,
        await this.#buildInsertableIdosCredential2(
          (record as AnyRecord).human_id,
          (record as AnyRecord).public_notes,
          (record as AnyRecord).content,
          receiverPublicKey, // Encryption
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
        record.content = await this.enclave.decrypt(record.content, record.encryption_public_key);
      }

      return record;
    }

    const records = await this.list<T & { id: string }>(tableName, <T & { id: string }>{
      id: recordId,
    });
    const record = records.find((r) => r.id === recordId);

    return record || null;
  }

  async getShared<T extends AnyRecord>(tableName: string, recordId: string): Promise<T | null> {
    if (tableName === "credentials") {
      const records = (await this.kwilWrapper.call(
        "get_credential_shared",
        { id: recordId },
        "Get credential shared with you in idOS",
        // biome-ignore lint/suspicious/noExplicitAny: using any to avoid type errors for now.
      )) as any;

      const record = records.find((r: { id: string }) => r.id === recordId);

      if (!record) return null;

      record.content = await this.enclave.decrypt(record.content, record.encryption_public_key);

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
    if (!this.enclave.encryptionPublicKey) await this.enclave.ready();

    let receiverPublicKey: string | undefined;
    // biome-ignore lint/suspicious/noExplicitAny: using any to avoid type errors for now.
    const record: any = recordLike;

    if (tableName === "credentials") {
      receiverPublicKey = receiverPublicKey ?? Base64Codec.encode(await this.enclave.ready());
      record.encryption_public_key = receiverPublicKey;
      record.content = await this.enclave.encrypt(record.content, receiverPublicKey);
    }

    if (tableName === "credential2s") {
      receiverPublicKey ??= Base64Codec.encode(await this.enclave.ready());
      Object.assign(
        record,
        await this.#buildInsertableIdosCredential2(
          record.human_id,
          record.public_notes,
          record.content,
          receiverPublicKey, // Encryption
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

  async share(
    tableName: string,
    recordId: string,
    receiverPublicKey: string,
  ): Promise<{ id: string }> {
    const encPublicKey = Base64Codec.encode(await this.enclave.ready());

    const name = this.singularize(tableName);

    // biome-ignore lint/suspicious/noExplicitAny: TBD
    const record = (await this.get(tableName, recordId)) as any;

    if (tableName === "credentials") {
      record.content = await this.enclave.encrypt(record.content as string, receiverPublicKey);
      record.encryption_public_key = encPublicKey;
    }

    if (tableName === "credential2s") {
      Object.assign(
        record,
        await this.#buildInsertableIdosCredential2(
          record.human_id,
          record.public_notes,
          record.content,
          receiverPublicKey, // Encryption
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
    );

    return { id };
  }

  async unshare(tableName: string, recordId: string): Promise<{ id: string }> {
    return await this.delete(tableName, recordId);
  }

  async addWriteGrant(grantee: string) {
    return await this.kwilWrapper.execute(
      "add_write_grant",
      [
        {
          wg_grantee: grantee,
        },
      ],
      `Grant ${grantee} write access to your idOS credentials`,
    );
  }

  async #buildInsertableIdosCredential2(
    humanId: string,
    publicNotes: string,
    plaintextContent: string,
    receiverEncryptionPublicKey: string,
  ): Promise<InsertableIdosCredential2> {
    const issuerAuthenticationSecretKey: Uint8Array = new Nonce(nacl.sign.secretKeyLength).bytes;

    const content = await this.enclave.encrypt(plaintextContent, receiverEncryptionPublicKey);
    const publicNotesSignature = nacl.sign.detached(
      Utf8Codec.encode(publicNotes),
      issuerAuthenticationSecretKey,
    );

    return {
      human_id: humanId,
      content,

      public_notes: publicNotes,
      public_notes_signature: Base64Codec.encode(publicNotesSignature),

      broader_signature: Base64Codec.encode(
        nacl.sign.detached(
          Uint8Array.from([...publicNotesSignature, ...Base64Codec.decode(content)]),
          issuerAuthenticationSecretKey,
        ),
      ),

      issuer: Base64Codec.encode(
        nacl.sign.keyPair.fromSecretKey(issuerAuthenticationSecretKey).publicKey,
      ),
      encryption_public_key: present(this.enclave.auth.currentUser.currentUserPublicKey),
    };
  }
}

const present = <T>(obj: T | undefined | null): T => {
  if (!obj) throw new Error("Unexpected absence");
  return obj;
};
