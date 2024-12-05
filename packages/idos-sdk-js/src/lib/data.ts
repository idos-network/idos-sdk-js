import type { idOSCredential } from "@idos-network/idos-sdk-types";
import * as Base64Codec from "@stablelib/base64";
import * as HexCodec from "@stablelib/hex";
import * as Utf8Codec from "@stablelib/utf8";
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
      recipientEncryptionPublicKey =
        recipientEncryptionPublicKey ?? Base64Codec.encode(await this.enclave.ready());
      for (const record of records) {
        Object.assign(
          record,
          await this.#buildInsertableIDOSCredential(
            record.human_id,
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
      tableName === "human_attributes" ? "attributes" : tableName,
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
      recipientEncryptionPublicKey ??= Base64Codec.encode(await this.enclave.ready());
      Object.assign(
        record,
        await this.#buildInsertableIDOSCredential(
          (record as AnyRecord).human_id,
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
      recipientEncryptionPublicKey ??= Base64Codec.encode(await this.enclave.ready());
      Object.assign(
        record,
        await this.#buildInsertableIDOSCredential(
          record.human_id,
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

  async share(
    tableName: string,
    recordId: string,
    granteeEncryptionPublicKey: string,
    synchronous?: boolean,
  ): Promise<{ id: string }> {
    const name = this.singularize(tableName);

    // biome-ignore lint/suspicious/noExplicitAny: TBD
    const record = (await this.get(tableName, recordId)) as any;

    if (tableName === "credentials") {
      Object.assign(
        record,
        await this.#buildInsertableIDOSCredential(
          record.human_id,
          "",
          record.content,
          granteeEncryptionPublicKey,
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
          wg_grantee: granteeAddress,
        },
      ],
      `Grant ${granteeAddress} write access to your idOS credentials`,
      synchronous,
    );
  }

  async hasWriteGrantGivenBy(humanId: string) {
    return await this.kwilWrapper.call("has_write_grant_given_by", { human_id: humanId });
  }

  async hasWriteGrantGivenTo(granteeAddress: string) {
    return await this.kwilWrapper.call("has_write_grant_given_to", { grantee: granteeAddress });
  }

  async #buildInsertableIDOSCredential(
    humanId: string,
    publicNotes: string,
    plaintextContent: string,
    receiverEncryptionPublicKey: string,
  ): Promise<InsertableIDOSCredential> {
    const issuerAuthenticationKeyPair = nacl.sign.keyPair();

    const content = await this.enclave.encrypt(plaintextContent, receiverEncryptionPublicKey);
    const publicNotesSignature = nacl.sign.detached(
      Utf8Codec.encode(publicNotes),
      issuerAuthenticationKeyPair.secretKey,
    );

    return {
      human_id: humanId,
      content,

      public_notes: publicNotes,
      public_notes_signature: Base64Codec.encode(publicNotesSignature),

      broader_signature: Base64Codec.encode(
        nacl.sign.detached(
          Uint8Array.from([...publicNotesSignature, ...Base64Codec.decode(content)]),
          issuerAuthenticationKeyPair.secretKey,
        ),
      ),

      issuer_auth_public_key: HexCodec.encode(issuerAuthenticationKeyPair.publicKey, true),
      encryption_public_key: isPresent(this.enclave.auth.currentUser.currentUserPublicKey),
    };
  }
}

const isPresent = <T>(obj: T | undefined | null): T => {
  // @todo: better error message.
  if (!obj) throw new Error("Unexpected absence");
  return obj;
};
