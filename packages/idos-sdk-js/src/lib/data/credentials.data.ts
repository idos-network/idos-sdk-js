import { encode } from "@stablelib/base64";
import invariant from "tiny-invariant";

import type { Enclave } from "../enclave";
import type { KwilWrapper } from "../kwil-wrapper";
import type { idOSCredential } from "../types";

import type { DataLayer } from "./types";

export class CredentialsData implements DataLayer<idOSCredential> {
  constructor(
    private readonly enclave: Enclave,
    private readonly kwilWrapper: KwilWrapper,
  ) {}

  async list(): Promise<idOSCredential[]> {
    const credentials = await this.kwilWrapper.call<idOSCredential[]>(
      "get_credentials",
      null,
      "List your credentials in idOS",
    );

    return credentials.filter((credential) => !credential.original_id);
  }

  async createMultiple(
    records: idOSCredential[],
    synchronous?: boolean | undefined,
  ): Promise<idOSCredential[]> {
    for (let record of records) {
      invariant(record.content, "idOSCredential content is required");
      record = await this.create(record, synchronous);
    }

    await this.kwilWrapper.execute<idOSCredential[]>(
      "create_credentials",
      records,
      "Create new credentials in your idOS profile",
      synchronous,
    );

    return records;
  }

  async create(record: idOSCredential, synchronous?: boolean): Promise<idOSCredential> {
    invariant(record.content, "idOSCredential Content is required");

    const receiverPublicKey = encode(await this.enclave.ready());
    if (!record.id) record.id = crypto.randomUUID();

    record.content = await this.enclave.encrypt(record.content, receiverPublicKey);
    record.encryption_public_key = receiverPublicKey;

    return this.kwilWrapper.execute<idOSCredential>(
      "add_credential",
      record,
      "Create a new record in your idOS profile",
      synchronous,
    );
  }

  async get(id: string): Promise<idOSCredential | null> {
    const credentials = await this.kwilWrapper.call<idOSCredential[]>(
      "get_credential_owned",
      { id },
      "Get your credential in idOS",
    );

    const credential = credentials.find((c) => c.id === id);

    if (!credential) return null;

    invariant(
      credential.content,
      "Unexpected missing idOSCredential content. idOSCredential content is required",
    );

    credential.content = await this.enclave.decrypt(
      credential.content,
      credential.encryption_public_key,
    );

    return credential;
  }
}
