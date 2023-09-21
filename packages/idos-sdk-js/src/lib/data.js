import { v4 as uuidv4 } from "uuid";

export class Data {
  constructor(idOS) {
    this.idOS = idOS;
  }

  singularize(tableName) {
    return tableName.replace(/s$/, "");
  }

  async list(tableName) {
    let records = await this.idOS.kwilWrapper.call(`get_${tableName}`);

    if (tableName === "credentials") {
      records.forEach((record, index) => {
        records[index] = {
          ...record,
          // FIXME what is `credential`?
          content: this.idOS.crypto.decrypt(credential.content),
        };
      });
    }

    return records;
  }

  async create(tableName, record) {
    let newRecord = await this.idOS.kwilWrapper.broadcast(`add_${this.singularize(tableName)}`, {
      id: uuidv4(),
      ...record,
    });

    return newRecord;
  }
}
