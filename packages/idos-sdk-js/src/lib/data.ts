import * as Base64Codec from "@stablelib/base64";
import { idOS } from "./idos";

export class Data {
  idOS: idOS;

  constructor(idOS: idOS) {
    this.idOS = idOS;
  }

  singularize(tableName: string): string {
    return tableName.replace(/s$/, "");
  }

  async list<T extends Record<string, unknown>>(
    tableName: string,
    filter?: Partial<T>
  ): Promise<T[]> {
    const records = (await this.idOS.kwilWrapper.call(
      `get_${tableName}`,
      null,
      `List your ${tableName} in idOS`
    )) as any;

    await this.idOS.auth.setHumanId(records[0]?.human_id);

    if (tableName === "attributes") {
      for (const record of records) {
        record.value = await this.idOS.enclave.decrypt(record.value);
      }
    }

    if (!filter) {
      return records;
    }

    const [key, value] = Object.entries(filter)[0];
    return records.filter((record: any) => !record[key] || record[key] === value);
  }

  async create<T extends Record<string, unknown>>(
    tableName: string,
    record: T,
    receiverPublicKey?: string
  ): Promise<T & { id: string }> {
    receiverPublicKey = receiverPublicKey ?? Base64Codec.encode(await this.idOS.enclave.init());
    const name = `add_${this.singularize(
      tableName === "human_attributes" ? "attributes" : tableName
    )}`;

    const inputs: string[] = ((await this.idOS.kwilWrapper.schema) as any).data.actions
      .find((action: any) => action.name === name)
      .inputs.map((input: string) => input.substring(1));

    const recordKeys = Object.keys(record);

    if (inputs.every((input) => recordKeys.includes(input))) {
      throw new Error(`Invalid payload for action ${name}`);
    }

    if (tableName === "credentials") {
      (record as any).content = await this.idOS.enclave.encrypt(
        (record as any).content as string,
        receiverPublicKey
      );
      (record as any).encryption_public_key = receiverPublicKey;
    }

    if (tableName === "attributes") {
      (record as any).value = await this.idOS.enclave.encrypt(
        (record as any).value as string,
        receiverPublicKey
      );
      (record as any).encryption_public_key = receiverPublicKey;
    }

    const newRecord = { id: crypto.randomUUID(), ...record };
    await this.idOS.kwilWrapper.broadcast(
      `add_${this.singularize(tableName)}`,
      newRecord,
      `Create new ${this.singularize(tableName)} in your idOS profile`
    );

    return newRecord;
  }

  async get<T extends Record<string, unknown>>(
    tableName: string,
    recordId: string
  ): Promise<T | null> {
    if (tableName === "credentials") {
      const records = (await this.idOS.kwilWrapper.call(
        `get_credential_owned`,
        { id: recordId },
        `Get your credential in idOS`
      )) as any;

      await this.idOS.auth.setHumanId(records?.[0]?.human_id);

      const record = records.find((r: any) => r.id === recordId);
      if (!record) return null;

      record.content = await this.idOS.enclave.decrypt(
        record.content,
        record.encryption_public_key
      );

      return record;
    }

    const records = await this.list<T & { id: string }>(tableName, <T & { id: string }>{
      id: recordId
    });
    const record = records.find((r) => r.id === recordId);

    return record || null;
  }

  async getShared<T extends Record<string, unknown>>(
    tableName: string,
    recordId: string
  ): Promise<T | null> {
    if (tableName === "credentials") {
      const records = (await this.idOS.kwilWrapper.call(
        `get_credential_shared`,
        { id: recordId },
        `Get credential shared with you in idOS`
      )) as any;

      const record = records.find((r: any) => r.id === recordId);
      if (!record) return null;

      record.content = await this.idOS.enclave.decrypt(
        record.content,
        record.encryption_public_key
      );

      return record;
    }

    const records = await this.list<T & { id: string }>(tableName, <T & { id: string }>{
      id: recordId
    });

    const record = records.find((r) => r.id === recordId);

    return record || null;
  }

  async delete(tableName: string, recordId: string): Promise<{ id: string }> {
    const record = { id: recordId };
    await this.idOS.kwilWrapper.broadcast(`remove_${this.singularize(tableName)}`, record);

    return record;
  }

  async update<T extends Record<string, unknown>>(tableName: string, record: T): Promise<T> {
    if (!this.idOS.enclave.initialized) await this.idOS.enclave.init();

    if (tableName === "credentials") {
      (record as any).content = await this.idOS.enclave.encrypt((record as any).content);
    }

    if (tableName === "attributes") {
      (record as any).value = await this.idOS.enclave.encrypt((record as any).value);
    }

    await this.idOS.kwilWrapper.broadcast(`edit_${this.singularize(tableName)}`, {
      ...record
    });

    return record;
  }

  async share(
    tableName: string,
    recordId: string,
    receiverPublicKey: string
  ): Promise<{ id: string }> {
    const encPublicKey = Base64Codec.encode(await this.idOS.enclave.init());

    const name = this.singularize(tableName);
    const record = (await this.get(tableName, recordId)) as any;

    if (tableName === "credentials") {
      record.content = await this.idOS.enclave.encrypt(record.content as string, receiverPublicKey);
      record.encryption_public_key = encPublicKey;
    }

    const id = crypto.randomUUID();
    await this.idOS.kwilWrapper.broadcast(
      `share_${name}`,
      {
        [`original_${name}_id`]: record.id,
        ...record,
        id
      },
      `Share a ${name} on idOS`
    );

    return { id };
  }

  async unshare(tableName: string, recordId: string): Promise<{ id: string }> {
    if (!this.idOS.enclave.initialized) await this.idOS.enclave.init();

    return await this.delete(tableName, recordId);
  }
}
