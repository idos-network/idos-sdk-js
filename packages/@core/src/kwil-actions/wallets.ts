import z from "zod";
import type { KwilActionClient } from "../kwil-infra";
import type { idOSWallet } from "../types";

const UpsertWalletParamsSchema: z.ZodObject<
  {
    id: z.ZodString;
    user_id: z.ZodString;
    address: z.ZodString;
    wallet_type: z.ZodString;
    message: z.ZodString;
    public_key: z.ZodString;
    signature: z.ZodString;
  },
  "strip"
> = z.object({
  id: z.string(),
  user_id: z.string(),
  address: z.string(),
  wallet_type: z.string(),
  message: z.string(),
  public_key: z.string(),
  signature: z.string(),
});

export type UpsertWalletParams = z.infer<typeof UpsertWalletParamsSchema>;

/**
 * Upserts a wallet as an `inserter`.
 */
export async function upsertWalletAsInserter(
  kwilClient: KwilActionClient,
  params: UpsertWalletParams,
): Promise<UpsertWalletParams> {
  const input = UpsertWalletParamsSchema.parse(params);
  await kwilClient.execute({
    name: "upsert_wallet_as_inserter",
    description: "Add a wallet to idOS",
    inputs: input,
  });

  return params;
}

const AddWalletParamsSchema: z.ZodObject<
  {
    id: z.ZodString;
    address: z.ZodString;
    public_key: z.ZodString;
    message: z.ZodString;
    signature: z.ZodString;
    user_id: z.ZodString;
    wallet_type: z.ZodString;
  },
  "strip"
> = z.object({
  id: z.string(),
  address: z.string(),
  public_key: z.string(),
  message: z.string(),
  signature: z.string(),
  user_id: z.string(),
  wallet_type: z.string(),
});

export type AddWalletParams = z.infer<typeof AddWalletParamsSchema>;

export async function addWallet(
  kwilClient: KwilActionClient,
  params: AddWalletParams,
): Promise<AddWalletParams> {
  const input = AddWalletParamsSchema.parse(params);
  await kwilClient.execute({
    name: "add_wallet",
    description: "Add a wallet to idOS",
    inputs: input,
  });

  return params;
}

export async function addWallets(
  kwilClient: KwilActionClient,
  params: AddWalletParams[],
): Promise<AddWalletParams[]> {
  await Promise.all(
    params.map((param) =>
      kwilClient.execute({
        name: "add_wallet",
        description: "Add a wallet to idOS",
        inputs: param,
      }),
    ),
  );

  return params;
}

export async function getWallets(kwilClient: KwilActionClient): Promise<idOSWallet[]> {
  return kwilClient.call<idOSWallet[]>({
    name: "get_wallets",
    inputs: {},
  });
}

export async function removeWallet(
  kwilClient: KwilActionClient,
  id: string,
): Promise<{ id: string }> {
  await kwilClient.execute({
    name: "remove_wallet",
    description: "Remove a wallet from idOS",
    inputs: { id },
  });

  return { id };
}

export async function removeWallets(
  kwilClient: KwilActionClient,
  ids: string[],
): Promise<string[]> {
  await Promise.all(
    ids.map((id) =>
      kwilClient.execute({
        name: "remove_wallet",
        description: "Remove a wallet from idOS",
        inputs: { id },
      }),
    ),
  );

  return ids;
}
