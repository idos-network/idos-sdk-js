import * as Base64Codec from "@stablelib/base64";
import type { Enclave } from "./enclave";
import type { KwilWrapper } from "./kwil-wrapper";

/* global crypto */

export class Data {
  constructor(
    public readonly kwilWrapper: KwilWrapper,
    public readonly enclave: Enclave,
  ) {}

  singularize(tableName: string): string {
    return tableName.replace(/s$/, "");
  }

  async list<T extends Record<string, unknown>>(
    tableName: string,
    filter?: Partial<T>,
  ): Promise<T[]> {
    let records = (await this.kwilWrapper.call(
      `get_${tableName}`,
      null,
      `List your ${tableName} in idOS`,
    )) as any;

    if (tableName === "credentials") {
      records = records.filter((record: any) => !record.original_id);
    }

    if (!filter) {
      return records;
    }

    const [key, value] = Object.entries(filter)[0];
    return records.filter((record: any) => !record[key] || record[key] === value);
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

  async createMultiple<T extends Record<string, unknown>>(
    tableName: string,
    records: T[],
    synchronous?: boolean,
  ) {
    let receiverPublicKey;

    if (tableName === "credentials") {
      receiverPublicKey = receiverPublicKey ?? Base64Codec.encode(await this.enclave.ready());
      for (const record of records) {
        (record as any).content = await this.enclave.encrypt(
          (record as any).content as string,
          receiverPublicKey,
        );
        (record as any).encryption_public_key = receiverPublicKey;
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

  async create<T extends Record<string, unknown>>(
    tableName: string,
    record: T,
    synchronous?: boolean,
  ): Promise<T & { id: string }> {
    const name = `add_${this.singularize(
      tableName === "human_attributes" ? "attributes" : tableName,
    )}`;

    let receiverPublicKey;

    const inputs: string[] = ((await this.kwilWrapper.schema) as any).data.actions
      .find((action: any) => action.name === name)
      .parameters.map((input: string) => input.substring(1));

    const recordKeys = Object.keys(record);

    if (inputs.every((input) => recordKeys.includes(input))) {
      throw new Error(`Invalid payload for action ${name}`);
    }

    if (tableName === "credentials") {
      receiverPublicKey = receiverPublicKey ?? Base64Codec.encode(await this.enclave.ready());
      (record as any).content = await this.enclave.encrypt(
        (record as any).content as string,
        receiverPublicKey,
      );
      (record as any).encryption_public_key = receiverPublicKey;
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

  async get<T extends Record<string, unknown>>(
    tableName: string,
    recordId: string,
    decrypt = true,
  ): Promise<T | null> {
    if (tableName === "credentials") {
      const records = (await this.kwilWrapper.call(
        "get_credential_owned",
        { id: recordId },
        "Get your credential in idOS",
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

  async getShared<T extends Record<string, unknown>>(
    tableName: string,
    recordId: string,
  ): Promise<T | null> {
    if (tableName === "credentials") {
      const records = (await this.kwilWrapper.call(
        "get_credential_shared",
        { id: recordId },
        "Get credential shared with you in idOS",
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

  async update<T extends Record<string, unknown>>(
    tableName: string,
    recordLike: T,
    description?: string,
    synchronous?: boolean,
  ): Promise<T> {
    if (!this.enclave.encryptionPublicKey) await this.enclave.ready();

    let receiverPublicKey: string | undefined;
    const record: any = recordLike;

    if (tableName === "credentials") {
      receiverPublicKey = receiverPublicKey ?? Base64Codec.encode(await this.enclave.ready());
      record.encryption_public_key = receiverPublicKey;
      record.content = await this.enclave.encrypt(record.content, receiverPublicKey);
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
}
