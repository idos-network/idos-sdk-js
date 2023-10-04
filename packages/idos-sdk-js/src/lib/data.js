import { v4 as uuidv4 } from "uuid";
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
    let records = await this.idOS.kwilWrapper.call(
      `get_${tableName}`,
      null,
      `List your ${tableName} in idOS`,
    );

    if (tableName === "credentials") {
      for (const record of records) {
        record.content = await this.idOS.crypto.decrypt(record.content);
      };
    }

    if (tableName === "attributes") {
      for (const record of records) {
        record.value = await this.idOS.crypto.decrypt(record.value);
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

    const id = uuidv4();

    if (tableName === "credentials") {
      record.content = await this.idOS.crypto.encrypt(record.content);
    }

    if (tableName === "attributes") {
      record.value = await this.idOS.crypto.encrypt(record.value);
    }

    let newRecord = await this.idOS.kwilWrapper.broadcast(
      `add_${this.singularize(tableName)}`,
      {
        id,
        ...record,
      },
      `Create new ${this.singularize(tableName)} in your idOS profile`,
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
    let records = await this.list(tableName, { id: recordId });
    return records[0];
  }

  /**
   * Deletes a record from the given table name.
   * @param {string} tableName
   * @param {string} recordId
   */
  async delete(tableName, recordId) {
    await this.idOS.kwilWrapper.broadcast(`remove_${this.singularize(tableName)}`, {
      id: recordId,
    });
  }

  /**
   * Updates a record in the given table name.
   * @param {string} tableName
   * @param {Record<string, unknown>} record
   * @returns {Promise<Record<string, unknown>>} the updated record payload
   */
  async update(tableName, record) {
    await this.idOS.kwilWrapper.broadcast(`edit_${this.singularize(tableName)}`, {
      ...record,
    });

    return record;
  }
}
