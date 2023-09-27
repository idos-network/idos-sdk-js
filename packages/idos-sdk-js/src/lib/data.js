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
    let records = await this.idOS.kwilWrapper.call(`get_${tableName}`);

    if (tableName === "credentials") {
      records.forEach((record, index) => {
        records[index] = {
          ...record,
          content: this.idOS.crypto.decrypt(record.content),
        };
      });
    }

    if (tableName === "attributes") {
      records.forEach((record, index) => {
        records[index] = {
          ...record,
          value: this.idOS.crypto.decrypt(record.value),
        };
      });
    }

    if (!filter) {
      return records;
    }

    const [key, value] = Object.entries(filter)[0];
    return records.filter((record) => !record[key] || record[key] === value);
  }

  async create(tableName, record) {
    let newRecord = await this.idOS.kwilWrapper.broadcast(`add_${this.singularize(tableName)}`, {
      id: uuidv4(),
      ...record,
    });

    return newRecord;
  }
}
