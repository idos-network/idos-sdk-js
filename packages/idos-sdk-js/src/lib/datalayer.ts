import type { KwilWrapper } from "./kwil-wrapper";

export class DataLayer<T extends { id: string }> {
  constructor(
    public readonly kwilWrapper: KwilWrapper,
    public readonly tableName: string,
  ) {}

  get entityName(): string {
    return this.singularize(this.tableName);
  }

  singularize(tableName: string): string {
    return tableName.replace(/s$/, "");
  }

  async list(): Promise<T[]> {
    return (await this.kwilWrapper.call(
      `get_${this.tableName}`,
      null,
      `List your ${this.tableName} in idOS`,
    )) as unknown as T[];
  }

  async createMultiple(records: T[], synchronous?: boolean): Promise<T[]> {
    const payload = records.map((record) => ({
      ...record,
      id: record.id ?? crypto.randomUUID(),
    }));

    await this.kwilWrapper.execute(
      `add_${this.entityName}`,
      payload,
      `Create new ${this.entityName} in your idOS profile`,
      synchronous,
    );

    return payload;
  }

  async create(record: T, synchronous?: boolean): Promise<T> {
    const payload = {
      ...record,
      id: record.id ?? crypto.randomUUID(),
    };

    await this.kwilWrapper.execute(
      `add_${this.entityName}`,
      [payload],
      `Create new ${this.entityName} in your idOS profile`,
      synchronous,
    );

    return payload;
  }

  async get(id: string): Promise<T | null> {
    const records = await this.list();
    const record = records.find((r) => r.id === id);
    return record || null;
  }

  async getShared(id: string): Promise<T | null> {
    const records = await this.list();
    const record = records.find((r) => r.id === id);
    return record || null;
  }

  async deleteMultiple(
    ids: string[],
    description?: string,
    synchronous?: boolean,
  ): Promise<{ id: string }[]> {
    const records = ids.map((id) => ({ id }));

    await this.kwilWrapper.execute(
      `remove_${this.singularize(this.tableName)}`,
      records,
      description,
      synchronous,
    );

    return records;
  }

  async delete(id: string, description?: string, synchronous?: boolean): Promise<{ id: string }> {
    const record = { id };
    await this.kwilWrapper.execute(
      `remove_${this.singularize(this.tableName)}`,
      [record],
      description,
      synchronous,
    );

    return record;
  }

  async update(record: T, description?: string, synchronous?: boolean): Promise<T> {
    await this.kwilWrapper.execute(
      `edit_${this.singularize(this.tableName)}`,
      [record],
      description,
      synchronous,
    );

    return record;
  }

  async share(id: string) {
    const record = await this.get(id);

    if (!record) {
      throw new Error(`Record not found: ${id}`);
    }

    const payload = {
      ...record,
      id: crypto.randomUUID(),
      [`original_${this.entityName}_id`]: record.id,
    };

    await this.kwilWrapper.execute(
      `share_${this.entityName}`,
      [payload],
      `Share a ${this.entityName} on idOS`,
    );

    return payload;
  }

  async unshare(id: string): Promise<{ id: string }> {
    return await this.delete(id);
  }
}
