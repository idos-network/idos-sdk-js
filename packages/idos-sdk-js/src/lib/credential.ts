import type { idOSCredential } from "@idos-network/idos-sdk-types";
import { encode } from "@stablelib/base64";
import { DataLayer } from "./datalayer";
import type { Enclave } from "./enclave";
import type { KwilWrapper } from "./kwil-wrapper";

export class CredentialDataLayer extends DataLayer<idOSCredential> {
  constructor(
    public readonly enclave: Enclave,
    public readonly kwilWrapper: KwilWrapper,
  ) {
    super(kwilWrapper, "credentials");
  }

  async get(id: string, decrypt = true) {
    const records = (await this.kwilWrapper.call(
      "get_credential_owned",
      { id },
      `Get your ${this.entityName} in idOS`,
    )) as unknown as idOSCredential[];

    const record = records.find((r: { id: string }) => r.id === id);

    if (!record) {
      return null;
    }

    if (decrypt) {
      record.content = await this.enclave.decrypt(record.content, record.encryption_public_key);
    }

    return record;
  }

  async listAll() {
    const result = await super.list();
    return result;
  }

  async list() {
    return (await this.listAll()).filter((record) => !record.original_id);
  }

  async listFilteredByCountries(countries: string[]) {
    const credentials = await this.list();

    const credentialsWithContent = (
      await Promise.all(
        credentials.map(async (credential) => {
          return await this.get(credential.id, false);
        }),
      )
    ).filter((record) => record !== null);

    if (!credentialsWithContent.length) return [];

    return this.enclave.filterCredentialsByCountries(
      // We do this because the type is not matching. Should update in future PR.
      credentialsWithContent as unknown as Record<string, string>[],
      countries,
    );
  }

  async create(payload: idOSCredential, synchronous?: boolean) {
    const record = { ...payload, id: payload.id ?? crypto.randomUUID() };

    const receiverPublicKey = encode(await this.enclave.ready());
    record.content = await this.enclave.encrypt(record.content, receiverPublicKey);
    record.encryption_public_key = receiverPublicKey;

    await super.create(record, synchronous);
    return record;
  }

  async createMultiple(payload: idOSCredential[]) {
    const receiverPublicKey = encode(await this.enclave.ready());
    const records: idOSCredential[] = [];

    for (const record of payload) {
      const encryptedRecord = {
        ...record,
        id: record.id ?? crypto.randomUUID(),
        content: await this.enclave.encrypt(record.content, receiverPublicKey),
        encryption_public_key: receiverPublicKey,
      };
      records.push(encryptedRecord);
    }

    await super.createMultiple(records);
    return records;
  }

  async delete(id: string, description?: string, synchronous?: boolean) {
    return await super.delete(id, description, synchronous);
  }

  async deleteMultiple(ids: string[], description?: string, synchronous?: boolean) {
    return await super.deleteMultiple(ids, description, synchronous);
  }

  async update(payload: idOSCredential, description?: string, synchronous?: boolean) {
    if (!this.enclave.encryptionPublicKey) {
      await this.enclave.ready();
    }

    const record = { ...payload, id: payload.id ?? crypto.randomUUID() };
    const receiverPublicKey = encode(await this.enclave.ready());
    record.encryption_public_key = receiverPublicKey;
    record.content = await this.enclave.encrypt(record.content, receiverPublicKey);

    return await super.update(record, description, synchronous);
  }

  async shareCredential(id: string, receiverPublicKey: string) {
    const encryptionPublicKey = encode(await this.enclave.ready());
    const record = await this.get(id);

    if (!record) {
      throw new Error("Record not found");
    }

    record.content = await this.enclave.encrypt(record.content, receiverPublicKey);
    record.encryption_public_key = encryptionPublicKey;

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

  async unshare(id: string) {
    return await this.delete(id);
  }
}
