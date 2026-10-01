import type { idOSClientLoggedIn } from "@idos-network/client";
import type {
  AddWalletInput,
  GetWalletsOutput,
  WalletType,
} from "@idos-network/kwil-infra/actions";

import { type DefaultError, useMutation, useQueryClient } from "@tanstack/react-query";
import invariant from "tiny-invariant";

import { useIDOSClient } from "@/hooks/idOS";

export const createWalletParamsFactory = ({
  address,
  publicKey,
  signature,
  notBefore,
  notAfter,
  walletType,
}: {
  address: string;
  publicKey?: string;
  signature: string;
  notBefore: string;
  notAfter: string;
  walletType: WalletType;
}): AddWalletInput => ({
  id: crypto.randomUUID() as string,
  address,
  wallet_type: walletType,
  public_key: publicKey ?? null,
  not_before: notBefore,
  not_after: notAfter,
  signature,
});

export const createWallet = async (
  idOSClient: idOSClientLoggedIn,
  params: {
    address: string;
    publicKey?: string;
    signature: string;
    notBefore: string;
    notAfter: string;
    walletType: WalletType;
  },
): Promise<GetWalletsOutput> => {
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
    GetWalletsOutput[],
    DefaultError,
    {
      address: string;
      publicKeys: string[];
      signature: string;
      notBefore: string;
      notAfter: string;
      walletType: WalletType;
    }
  >({
    mutationFn: async ({ address, publicKeys, signature, notBefore, notAfter, walletType }) => {
      if (publicKeys.length > 0) {
        return Promise.all(
          publicKeys.map((publicKey) =>
            createWallet(idOSClient, {
              address,
              publicKey,
              signature,
              notBefore,
              notAfter,
              walletType,
            }),
          ),
        );
      }
      return [
        await createWallet(idOSClient, { address, signature, notBefore, notAfter, walletType }),
      ];
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["wallets"] }),
  });
}

export function useDeleteWalletMutation() {
  const idOSClient = useIDOSClient();
  const queryClient = useQueryClient();

  return useMutation<void, DefaultError, GetWalletsOutput[]>({
    mutationFn: async (wallets) => {
      await idOSClient.removeWallets(wallets.map((wallet) => wallet.id));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["wallets"] }),
  });
}
