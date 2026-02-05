import { FormControl, FormLabel, Input } from "@chakra-ui/react";
import * as GemWallet from "@gemwallet/api";
import type { idOSClientLoggedIn, idOSWallet } from "@idos-network/client";
import { getXrpPublicKey } from "@idos-network/core";
import { type DefaultError, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { PlusIcon } from "lucide-react";
import type { FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import invariant from "tiny-invariant";
import { useAccount, useSignMessage } from "wagmi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import useDisclosure from "@/hooks/useDisclosure";
import { useIdOS } from "@/idOS.provider";
import { getNearFullAccessPublicKeys } from "@/utils/near";

type AddWalletProps = {
  defaultValue?: string;
};

const createWalletParamsFactory = ({
  address,
  public_key,
  signature,
  message,
}: {
  address: string;
  public_key?: string;
  signature?: string;
  message: string;
}) => ({
  id: crypto.randomUUID() as string,
  address,
  public_key: public_key ?? null,
  message,
  signature: signature ?? "",
});

const createWallet = async (
  idOSClient: idOSClientLoggedIn,
  params: { address: string; public_key?: string; signature?: string; message: string },
): Promise<idOSWallet> => {
  const walletParams = createWalletParamsFactory(params);
  await idOSClient.addWallet(walletParams);

  const insertedWallet = (await idOSClient.getWallets()).find((w) => w.id === walletParams.id);
  invariant(insertedWallet, "insertedWallet is undefined, idOSClient.addWallet must have failed");

  return insertedWallet;
};

const useAddWalletMutation = () => {
  const idOSClient = useIdOS();
  const queryClient = useQueryClient();

  return useMutation<
    // biome-ignore lint/suspicious/noExplicitAny: Will need to be fixed in the future.
    any,
    DefaultError,
    { address: string; publicKeys: string[]; signature: string; message: string },
    { previousWallets: idOSWallet[] }
  >({
    mutationFn: async ({ address, publicKeys, signature, message }) => {
      if (publicKeys.length > 0) {
        return Promise.all(
          publicKeys.map((public_key) =>
            createWallet(idOSClient, { address, public_key, signature, message }),
          ),
        );
      }
      return [await createWallet(idOSClient, { address, message, signature })];
    },

    onMutate: async ({ address, publicKeys, signature, message }) => {
      await queryClient.cancelQueries({ queryKey: ["wallets"] });
      const previousWallets = queryClient.getQueryData<idOSWallet[]>(["wallets"]) ?? [];

      const wallets = publicKeys.map((public_key) =>
        createWalletParamsFactory({ address, public_key, signature, message }),
      );
      const payload =
        wallets.length > 0 ? wallets : [createWalletParamsFactory({ address, signature, message })];

      queryClient.setQueryData<idOSWallet[]>(["wallets"], (old = []) => [
        ...old,
        ...(payload as idOSWallet[]),
      ]);

      return { previousWallets };
    },
  });
};

export const AddWalletUsingModal = ({ defaultValue }: AddWalletProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure({ defaultIsOpen: !!defaultValue });
  const { signMessageAsync } = useSignMessage();
  const { open } = useWeb3Modal();
  const { address: connectedEvmAddress } = useAccount();

  const [searchParams] = useSearchParams();
  const publicKeyParam = searchParams.get("publicKey");

  const queryClient = useQueryClient();

  const addWallet = useAddWalletMutation();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    let publicKeys: string[] = [];

    const form = event.currentTarget as HTMLFormElement;
    const address = new FormData(form).get("address") as string;

    // Address validation patterns
    const evm_regexp = /^0x[0-9a-fA-F]{40}$/;
    const near_regexp = /^[a-zA-Z0-9._-]+\.near$/;
    const xrp_address_regexp = /^r[0-9a-zA-Z]{24,34}$/;

    let address_type: "EVM" | "NEAR" | "XRPL" | "INVALID";

    if (evm_regexp.test(address)) {
      address_type = "EVM";
    } else if (near_regexp.test(address)) {
      address_type = "NEAR";
    } else if (xrp_address_regexp.test(address)) {
      address_type = "XRPL";
    } else {
      address_type = "INVALID";
    }
    if (address_type === "EVM") {
      if (!connectedEvmAddress) {
        handleClose();
        await open();
        return;
      }
      publicKeys = [address];
    }

    if (address_type === "INVALID") {
      toast({
        title: "Invalid wallet address",
        description: "Please enter a valid EVM, NEAR, or XRPL wallet address/public key.",
        position: "bottom-right",
        status: "error",
      });
      return;
    }

    if (address_type === "XRPL") {
      const result = await getXrpPublicKey(GemWallet);
      invariant(result?.address, "Failed to get XRPL address");
      // validate passed public key in case user is not connected to intended wallet
      if (result?.address !== address) {
        toast({
          title: "Error while adding wallet",
          description: "Unexpected wallet address.",
          status: "error",
        });
        return;
      }
      if (publicKeyParam) {
        if (result?.publicKey === publicKeyParam) {
          publicKeys = [result?.publicKey ?? ""];
        } else {
          toast({
            title: "Error while adding wallet",
            description: "Public key doesn't match the wallet address.",
            status: "error",
          });
        }
      } else {
        publicKeys = [result?.publicKey ?? ""];
      }
    }

    if (address_type === "NEAR") {
      publicKeys = (await getNearFullAccessPublicKeys(address)) || [];

      if (!publicKeys.length) {
        toast({
          title: "Error while adding wallet",
          description:
            "We can't find a `FullAccessKey` for this NEAR address. idOS doesn't support this wallet.",
          position: "bottom-right",
          status: "error",
        });
        return;
      }
    }
    let signature: `0x${string}` | string = "";
    const message = "Please sign this message to add this wallet to your idOS account.";

    // @todo: handle other blockchain signing mechanism
    if (address_type === "EVM") {
      try {
        const _signature = await signMessageAsync({
          message,
          account: address as `0x${string}`,
        });
        signature = _signature as `0x${string}`;
      } catch (error) {
        console.error(error);
        toast({
          title: "Error while adding wallet",
          description:
            "Error while signing message. Please make sure you are connected to the wallet you want to add.",
          position: "bottom-right",
          status: "error",
        });
        return;
      }
    }

    addWallet.mutate(
      {
        address,
        publicKeys: publicKeys.length > 0 ? publicKeys : [address],
        signature,
        message,
      },
      {
        async onSuccess(wallets: idOSWallet[]) {
          const cache = queryClient.getQueryData<idOSWallet[]>(["wallets"]) ?? [];
          const updated = cache.map((cachedWallet) => {
            if (!cachedWallet.id) {
              const wallet = wallets.find(
                (wallet) =>
                  wallet.address === cachedWallet.address &&
                  wallet.public_key === cachedWallet.public_key,
              );
              return wallet;
            }
            return cachedWallet;
          });
          queryClient.setQueryData<idOSWallet[]>(["wallets"], updated as idOSWallet[]);
          form.reset();
          handleClose();
        },
        async onError(_, __, ctx) {
          console.log(_);

          queryClient.setQueryData(["wallets"], ctx?.previousWallets);
          toast({
            title: "Error while adding wallet",
            description: "An unexpected error. Please try again.",
            position: "bottom-right",
            status: "error",
          });
        },
      },
    );
  };

  const handleClose = () => {
    addWallet.reset();
    onClose();
  };

  return (
    <>
      <Button
        id="add-wallet-button"
        onClick={onOpen}
        isLoading={addWallet.isPending}
        aria-label="Add wallet"
      >
        <PlusIcon size={24} />
        <span className="sr-only md:not-sr-only">Add wallet</span>
      </Button>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent>
          <form name="add-wallet-form" onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Insert wallet address</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <FormControl>
                <FormLabel fontSize="sm" htmlFor="address">
                  Wallet address
                </FormLabel>
                <Input
                  id="address"
                  name="address"
                  placeholder="Enter address"
                  required={true}
                  defaultValue={defaultValue}
                />
              </FormControl>
            </div>
            <DialogFooter>
              <Button id="add-wallet-form-submit" type="submit" isLoading={addWallet.isPending}>
                {addWallet.isError ? "Try again" : "Add wallet"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
