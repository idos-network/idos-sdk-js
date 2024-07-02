import type { idOSCredential } from "../types";
import type { CredentialsData } from "./credentials.data";

export class Data {
  constructor(private readonly credentialsData: CredentialsData) {}

  async list(tableName: string) {
    if (tableName === "credentials") {
      return this.credentialsData.list();
    }

    return [];
  }

  async createMultiple<T>(tableName: string, records: T, synchronous?: boolean) {
    if (tableName === "credentials") {
      return this.credentialsData.createMultiple(records as idOSCredential[], synchronous);
    }

    return [];
  }
}
