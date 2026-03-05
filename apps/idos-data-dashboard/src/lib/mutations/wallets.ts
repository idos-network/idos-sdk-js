import type { idOSClientLoggedIn, idOSWallet } from "@idos-network/client";
import type { AddWalletInput, WalletType } from "@idos-network/kwil-infra/actions";
import { type DefaultError, useMutation, useQueryClient } from "@tanstack/react-query";
import invariant from "tiny-invariant";
import { useIDOSClient } from "@/hooks/idOS";

export const createWalletParamsFactory = ({
  address,
  publicKey,
  signature,
  message,
  walletType,
}: {
  address: string;
  publicKey?: string;
  signature: string;
  message: string;
  walletType: WalletType;
}): AddWalletInput => ({
  id: crypto.randomUUID() as string,
  address,
  wallet_type: walletType,
  public_key: publicKey ?? null,
  message,
  signature,
});

export const createWallet = async (
  idOSClient: idOSClientLoggedIn,
  params: {
    address: string;
    publicKey?: string;
    signature: string;
    message: string;
    walletType: WalletType;
  },
): Promise<idOSWallet> => {
  const walletParams = createWalletParamsFactory(params);
  await idOSClient.addWallet(walletParams);

  const insertedWallet = (await idOSClient.getWallets()).find((w) => w.id === walletParams.id);

  invariant(
    insertedWallet,
    "`insertedWallet` is `undefined`, `idOSClient.addWallet` must have failed",
  );

  return insertedWallet;
};

export function useAddWalletMutation() {
  const idOSClient = useIDOSClient();
  const queryClient = useQueryClient();

  return useMutation<
    idOSWallet[],
    DefaultError,
    {
      address: string;
      publicKeys: string[];
      signature: string;
      message: string;
      walletType: WalletType;
    }
  >({
    mutationFn: async ({ address, publicKeys, signature, message, walletType }) => {
      if (publicKeys.length > 0) {
        return Promise.all(
          publicKeys.map((publicKey) =>
            createWallet(idOSClient, {
              address,
              publicKey,
              signature,
              message,
              walletType,
            }),
          ),
        );
      }
      return [await createWallet(idOSClient, { address, signature, message, walletType })];
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["wallets"] }),
  });
}

export function useDeleteWalletMutation() {
  const idOSClient = useIDOSClient();
  const queryClient = useQueryClient();

  return useMutation<void, DefaultError, idOSWallet[]>({
    mutationFn: async (wallets) => {
      await idOSClient.removeWallets(wallets.map((wallet) => wallet.id));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["wallets"] }),
  });
}
