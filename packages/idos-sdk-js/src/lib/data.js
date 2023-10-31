import * as Base64Codec from "@stablelib/base64";

export class Data {
  constructor(idOS) {
    this.idOS = idOS;
  }

  singularize(tableName) {
    return tableName.replace(/s$/, "");
  }

  async list(tableName, filter) {
    let records = await this.idOS.kwilWrapper.call(`get_${tableName}`, null, `List your ${tableName} in idOS`);
    if (tableName === "attributes") {
      for (const record of records) {
        record.value = Utf8Codec.decode(
          await this.idOS.crypto.decrypt(
            record.value,
            this.idOS.crypto.publicKeys.encryption,
          ),
        );
      }
    }

    if (!filter) {
      return records;
    }
    const [key, value] = Object.entries(filter)[0];
    return records.filter((record) => !record[key] || record[key] === value);
  }

  async create(tableName, record, receiverPublicKey) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    receiverPublicKey = receiverPublicKey ?? this.idOS.crypto.publicKeys.encryption;
    const name = `add_${this.singularize(tableName === "human_attributes" ? "attributes" : tableName)}`;
    const schema = await this.idOS.kwilWrapper.schema;
    const actionFromSchema = schema.data.actions.find((action) => action.name === name);
    const inputs = actionFromSchema.inputs.map((input) => input.substring(1));
    const recordKeys = Object.keys(record);
    if (inputs.every((input) => recordKeys.includes(input))) {
      throw new Error(`Invalid payload for action ${name}`);
    }
    if (tableName === "credentials") {
      record.content = Base64Codec.encode(
        await this.idOS.crypto.encrypt(record.content),
      );
      record.encryption_public_key = Base64Codec.encode(
        this.idOS.crypto.publicKeys.encryption,
      );
    }
    if (tableName === "attributes") {
      record.value = Base64Codec.encode(
        await this.idOS.crypto.encrypt(record.value),
      );
    }
    let newRecord = { id: crypto.randomUUID(), ...record };
    await this.idOS.kwilWrapper.broadcast(
      `add_${this.singularize(tableName)}`,
      newRecord,
      `Create new ${this.singularize(tableName)} in your idOS profile`
    );
    return newRecord;
  }

  async get(tableName, recordId) {
    if (tableName === "credentials") {
      let [record] = await this.idOS.kwilWrapper.call(
        `get_credential_owned`,
        { id: recordId },
        `Get your credential in idOS`
      );
      record.content = Utf8Codec.decode(
        await this.idOS.crypto.decrypt(
          record.content,
          Base64Codec.decode(record.encryption_public_key),
        )
      );
      return record;
    }
    let records = await this.list(tableName, { id: recordId });
    return records[0];
  }

  async delete(tableName, recordId) {
    const record = { id: recordId };
    await this.idOS.kwilWrapper.broadcast(`remove_${this.singularize(tableName)}`, record);
    return record;
  }

  async update(tableName, record) {
    if (tableName === "credentials") {
      record.content = Base64Codec.encode(
        await this.idOS.crypto.encrypt(record.content),
      );
    }

    if (tableName === "attributes") {
      record.value = await this.idOS.crypto.encrypt(record.value);
    }

    await this.idOS.kwilWrapper.broadcast(`edit_${this.singularize(tableName)}`, {
      ...record,
    });
    return record;
  }

  async share(tableName, recordId, receiverPublicKey) {
    const name = this.singularize(tableName);
    let record = await this.get(tableName, recordId);

    if (tableName === "credentials") {
      const content = record.content;
      record.content = await this.idOS.crypto.encrypt(content, Base64Codec.decode(receiverPublicKey));
      record.encryption_public_key = receiverPublicKey;
    }

    const id = crypto.randomUUID();
    await this.idOS.kwilWrapper.broadcast(`share_${name}`, {
      [`original_${name}_id`]: record.id,
      ...record,
      id,
    }, `Share a ${name} on idOS`);
    return { id };
  }

  async unshare(tableName, recordId) {
    return await this.delete(tableName, recordId);
  }
}
