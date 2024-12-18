import type Grant from "./grant";

export interface GrantChild {
  list(_: Partial<Omit<Grant, "lockedUntil">>): Promise<Grant[]>;
  create(
    _: Omit<Grant, "ownerAddress"> & { wait?: boolean },
  ): Promise<{ grant: Grant; transactionId: string }>;
  messageForCreateBySignature(_: Grant): Promise<string>;
  createBySignature(_: Grant & { signature: Uint8Array; wait?: boolean }): Promise<{
    grant: Grant;
    transactionId: string;
  }>;
  revoke(
    _: Omit<Grant, "ownerAddress"> & { wait?: boolean },
  ): Promise<{ grant: Grant; transactionId: string }>;
  messageForRevokeBySignature(_: Grant): Promise<string>;
  revokeBySignature(_: Grant & { signature: Uint8Array; wait?: boolean }): Promise<{
    grant: Grant;
    transactionId: string;
  }>;
}
