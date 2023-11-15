import * as Base64Codec from "@stablelib/base64";

type idOS = any; // TODO Replace this when it's typed.

export class Data {
  idOS: idOS;

  constructor(idOS: idOS) {
    this.idOS = idOS;
  }

  singularize(tableName: string) {
    return tableName.replace(/s$/, "");
  }

  async list(tableName: string, filter: Record<string, any>) {
    let records = await this.idOS.kwilWrapper.call(`get_${tableName}`, null, `List your ${tableName} in idOS`);

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

  async create(tableName: string, record: any, receiverPublicKey: string) {
    receiverPublicKey = receiverPublicKey ?? Base64Codec.encode(await this.idOS.enclave.init());
    const name = `add_${this.singularize(tableName === "human_attributes" ? "attributes" : tableName)}`;
    const schema = await this.idOS.kwilWrapper.schema;
    const actionFromSchema = schema.data.actions.find((action: any) => action.name === name);
    const inputs: string[] = actionFromSchema.inputs.map((input: string) => input.substring(1));
    const recordKeys = Object.keys(record);
    if (inputs.every((input) => recordKeys.includes(input))) {
      throw new Error(`Invalid payload for action ${name}`);
    }
    if (tableName === "credentials") {
      record.content = await this.idOS.enclave.encrypt(record.content, receiverPublicKey);
      record.encryption_public_key = receiverPublicKey;
    }
    if (tableName === "attributes") {
      record.value = await this.idOS.enclave.encrypt(record.value, receiverPublicKey);
      record.encryption_public_key = receiverPublicKey;
    }
    let newRecord = { id: crypto.randomUUID(), ...record };
    await this.idOS.kwilWrapper.broadcast(
      `add_${this.singularize(tableName)}`,
      newRecord,
      `Create new ${this.singularize(tableName)} in your idOS profile`
    );
    return newRecord;
  }

  async get(tableName: string, recordId: string) {
    if (tableName === "credentials") {
      let records = await this.idOS.kwilWrapper.call(
        `get_credential_owned`,
        { id: recordId },
        `Get your credential in idOS`
      );

      await this.idOS.auth.setHumanId(records?.[0]?.human_id);
      let record = records.find((r: any) => r.id === recordId);
      if (!record) return record;
      record.content = await this.idOS.enclave.decrypt(record.content, record.encryption_public_key);
      return record;
    }
    let records = await this.list(tableName, { id: recordId });
    let record = records.find((r: any) => r.id === recordId);
    return record;
  }

  async delete(tableName: string, recordId: string) {
    if (!this.idOS.enclave.initialized) await this.idOS.enclave.init();

    const record = { id: recordId };
    await this.idOS.kwilWrapper.broadcast(`remove_${this.singularize(tableName)}`, record);
    return record;
  }

  async update(tableName: string, record: any) {
    if (!this.idOS.enclave.initialized) await this.idOS.enclave.init();

    if (tableName === "credentials") {
      record.content = await this.idOS.enclave.encrypt(record.content);
    }

    if (tableName === "attributes") {
      record.value = await this.idOS.enclave.encrypt(record.value);
    }

    await this.idOS.kwilWrapper.broadcast(`edit_${this.singularize(tableName)}`, {
      ...record,
    });
    return record;
  }

  async share(tableName: string, recordId: string, receiverPublicKey: string) {
    if (!this.idOS.enclave.initialized) await this.idOS.enclave.init();

    const name = this.singularize(tableName);
    let record = await this.get(tableName, recordId);

    if (tableName === "credentials") {
      record.content = await this.idOS.enclave.encrypt(record.content, receiverPublicKey);
      record.encryption_public_key = receiverPublicKey;
    }

    const id = crypto.randomUUID();
    await this.idOS.kwilWrapper.broadcast(
      `share_${name}`,
      {
        [`original_${name}_id`]: record.id,
        ...record,
        id,
      },
      `Share a ${name} on idOS`
    );
    return { id };
  }

  async unshare(tableName: string, recordId: string) {
    if (!this.idOS.enclave.initialized) await this.idOS.enclave.init();

    return await this.delete(tableName, recordId);
  }
}
