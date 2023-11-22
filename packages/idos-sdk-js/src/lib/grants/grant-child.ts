import Grant from "./grant";

export abstract class GrantChild {
  static async build(..._: any[]): Promise<GrantChild> {
    throw new Error("Unimplemented");
  }

  async list(_: Partial<Omit<Grant, "lockedUntil">>): Promise<Grant[]> {
    throw new Error("Unimplemented");
  }

  async create(_: Omit<Grant, "owner"> & { wait?: boolean }): Promise<{ transactionId: string }> {
    throw new Error("Unimplemented");
  }

  async revoke(_: Omit<Grant, "owner"> & { wait?: boolean }): Promise<{ transactionId: string }> {
    throw new Error("Unimplemented");
  }
}
