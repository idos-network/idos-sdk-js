export class Data {
  constructor(idOS) {
    this.idOS = idOS;
  }

  singularize(tableName) {
    return tableName.replace(/s$/, "");
  }

  /**
   * Returns a list of records from the given table name.
   * Can be optionally filtered by a single key/value pair.
   * @param {string} tableName
   * @param {Record<string, string>} filter
   * @returns {Promise<Array<Record<string, unknown>>}
   */
  async list(tableName, filter) {
    let records = await this.idOS.kwilWrapper.call(`get_${tableName}`, null, `List your ${tableName} in idOS`);

    if (tableName === "attributes") {
      for (const record of records) {
        record.value = await this.idOS.crypto.decrypt(record.value, this.idOS.crypto.publicKeys.encryption.base64);
      }
    }

    if (!filter) {
      return records;
    }

    const [key, value] = Object.entries(filter)[0];
    return records.filter((record) => !record[key] || record[key] === value);
  }

  /**
   * Creates a record in the given table name.
   * @param {string} tableName
   * @param {Record<string, unknown>} record
   * @param {Record<string, unknown>} receiverPublicKey
   * @throws {Error} if the record payload is invalid
   * @returns {Promise<Record<string, unknown>>} the new created record
   */
  async create(tableName, record, receiverPublicKey) {
    receiverPublicKey = receiverPublicKey ?? this.idOS.crypto.publicKeys.encryption.raw;
    const name = `add_${this.singularize(tableName === "human_attributes" ? "attributes" : tableName)}`;
    const schema = await this.idOS.kwilWrapper.schema;
    const actionFromSchema = schema.data.actions.find((action) => action.name === name);

    const inputs = actionFromSchema.inputs.map((input) => input.substring(1));
    const recordKeys = Object.keys(record);

    if (inputs.every((input) => recordKeys.includes(input))) {
      throw new Error(`Invalid payload for action ${name}`);
    }

    if (tableName === "credentials") {
      record.content = await this.idOS.crypto.encrypt(record.content);
      record.encryption_public_key = this.idOS.crypto.publicKeys.encryption.base64;
    }

    if (tableName === "attributes") {
      record.value = await this.idOS.crypto.encrypt(record.value);
    }

    let newRecord = { id: crypto.randomUUID(), ...record };

    await this.idOS.kwilWrapper.broadcast(
      `add_${this.singularize(tableName)}`,
      newRecord,
      `Create new ${this.singularize(tableName)} in your idOS profile`
    );

    return newRecord;
  }

  /**
   * Gets a record from the given table name.
   * @param {string} tableName
   * @param {string} recordId
   * @returns {Promise<Record<string, unknown>>}
   */
  async get(tableName, recordId) {
    if (tableName === "credentials") {
      let [record] = await this.idOS.kwilWrapper.call(
        `get_credential_owned`,
        { id: recordId },
        `Get your credential in idOS`
      );
      record.content = await this.idOS.crypto.decrypt(record.content, record.encryption_public_key);
      return record;
    }

    let records = await this.list(tableName, { id: recordId });
    return records[0];
  }

  /**
   * Deletes a record from the given table name.
   * @param {string} tableName
   * @param {string} recordId
   */
  async delete(tableName, recordId) {
    const record = { id: recordId };

    await this.idOS.kwilWrapper.broadcast(`remove_${this.singularize(tableName)}`, record);

    return record;
  }

  /**
   * Updates a record in the given table name.
   * @param {string} tableName
   * @param {Record<string, unknown>} record
   * @returns {Promise<Record<string, unknown>>} the updated record payload
   */
  async update(tableName, record) {
    if (tableName === "credentials") {
      console.log(record);
      record.content = await this.idOS.crypto.encrypt(record.content);
    }

    if (tableName === "attributes") {
      record.value = await this.idOS.crypto.encrypt(record.value);
    }

    await this.idOS.kwilWrapper.broadcast(`edit_${this.singularize(tableName)}`, {
      ...record,
    });

    return record;
  }

  /**
   * Creates a duplicate record in the given table name,
   * and a corresponding entry in the shared_tableName table
   * @param {string} tableName
   * @param {Record<string, unknown>} record
   * @returns {Promise<Record<string, unknown>>} the updated record payload
   */
  async share(tableName, record, newRecord) {
    const name = this.singularize(tableName);

    await this.idOS.kwilWrapper.broadcast(`share_${name}`, {
      [`original_${name}_id`]: record.id,
      ...newRecord,
    });

    return { id: newRecord.id };
  }
}
