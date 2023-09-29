import { Box, Button, Flex, useDisclosure, useToast } from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ConfirmDialog } from "@/lib/components/confirm-dialog.tsx";

import { WalletEditor, WalletEditorFormValues } from "./components/wallet-editor";
import { WalletsTable } from "./components/wallets-table";
import { useCreateWallet, useRemoveWallet } from "./mutations";
import { useFetchWallets } from "./queries";
import { Wallet } from "./types";

export function Component() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  const [wallet, setWallet] = useState<Wallet>();

  const { isOpen: isEditorOpen, onOpen: onEditorOpen, onClose: onEditorClose } = useDisclosure();
  const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();

  const wallets = useFetchWallets();

  const createWallet = useCreateWallet({
    async onMutate(wallet) {
      await queryClient.cancelQueries(useFetchWallets.getKey());
      const previousWallets = wallets.data;
      if (previousWallets) {
        wallets.setData([...previousWallets, { ...wallet, human_id: "", message: "", signature: "", id: "" }]);
      }
      return { previousWallets };
    },
    onError(_, __, context) {
      if (context?.previousWallets) {
        wallets.setData(context.previousWallets);
      }
    },
  });
  const removeWallet = useRemoveWallet({
    async onMutate(wallet) {
      await queryClient.cancelQueries(useFetchWallets.getKey());
      const previousWallets = wallets.data;
      if (previousWallets) {
        wallets.setData([...previousWallets.filter((w) => w.id !== wallet.id)]);
      }
      return { previousWallets };
    },
    onError(_, __, context) {
      if (context?.previousWallets) {
        wallets.setData(context.previousWallets);
      }
    },
  });

  const onEditorSubmit = (values: WalletEditorFormValues) => {
    onEditorClose();
    createWallet.mutate(
      {
        ...values,
      },
      {
        onSuccess() {
          toast({
            title: t("wallet-successfully-created"),
          });
        },
        onError() {
          toast({
            title: t("error-while-adding-wallet"),
            status: "error",
          });
        },
      }
    );
  };

  const onWalletRemove = (wallet: Wallet) => {
    setWallet(wallet);
    onConfirmOpen();
  };

  const onWalletRemoveCancel = () => {
    setWallet(undefined);
    onConfirmClose();
  };

  const onRemoveConfirm = () => {
    onConfirmClose();
    setWallet(undefined);
    if (wallet) {
      removeWallet.mutate(
        {
          id: wallet.id,
        },
        {
          onSuccess() {
            toast({
              title: t("wallet-successfully-removed"),
            });
          },
          onError() {
            toast({
              title: t("error-while-removing-wallet"),
              status: "error",
            });
          },
        }
      );
    }
  };

  const isLoading = wallets.isFetching || createWallet.isLoading || removeWallet.isLoading;

  return (
    <Box>
      <Flex align="center" justify="end" mb={5}>
        <Button colorScheme="green" onClick={onEditorOpen} variant="outline">
          {t("new-wallet")}
        </Button>
      </Flex>
      <WalletsTable isLoading={isLoading} wallets={wallets.data} onWalletRemove={onWalletRemove} />
      <WalletEditor
        isOpen={isEditorOpen}
        onClose={onEditorClose}
        onSubmit={onEditorSubmit}
        isLoading={createWallet.isLoading}
      />
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={onWalletRemoveCancel}
        onConfirm={onRemoveConfirm}
        title={t("remove-wallet")}
        isLoading={removeWallet.isLoading}
        description={t("are-sure-you-want-to-remove-wallet", {
          address: wallet?.address,
        })}
      />
    </Box>
  );
}
