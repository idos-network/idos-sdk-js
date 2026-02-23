import type { FaceSignSignerProvider } from "@idos-network/kwil-infra/facesign";
import {
  verifySignature,
  type WalletSignature,
} from "@idos-network/kwil-infra/signature-verification";
import { hexEncode } from "@idos-network/utils/codecs";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAddWalletMutation } from "@/lib/mutations/wallets";
import { FacesignDialog } from "./facesign-dialog";

const ADD_WALLET_MESSAGE = "Sign this message to add FaceSign to your idOS profile";

async function createProvider() {
  const { FaceSignSignerProvider } = await import("@idos-network/kwil-infra/facesign");

  const enclaveUrl = import.meta.env.VITE_FACESIGN_ENCLAVE_URL;
  if (!enclaveUrl) {
    throw new Error("VITE_FACESIGN_ENCLAVE_URL is not set");
  }

  return new FaceSignSignerProvider({
    metadata: {
      name: "idOS Dashboard",
      description: "Add FaceSign to your idOS profile",
    },
    enclaveUrl,
  });
}

export function FacesignBanner() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const providerRef = useRef<FaceSignSignerProvider | null>(null);
  const addWalletMutation = useAddWalletMutation();

  const handleCreateClick = async () => {
    setIsLoading(true);

    try {
      const provider = await createProvider();
      const { hasKey } = await provider.preload();

      if (hasKey) {
        providerRef.current = provider;
        await runAddWalletFlow(provider);
      } else {
        providerRef.current = provider;
        setDialogOpen(true);
      }
    } catch (error) {
      console.error("FaceSign preload failed:", error);
      providerRef.current?.destroy();
      providerRef.current = null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = async () => {
    setIsLoading(true);

    try {
      let provider = providerRef.current;
      if (!provider) {
        provider = await createProvider();
        providerRef.current = provider;
      }

      setDialogOpen(false);
      await runAddWalletFlow(provider);
    } catch (error) {
      console.error("Failed to add FaceSign:", error);
      toast.error("Failed to add FaceSign", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      providerRef.current?.destroy();
      providerRef.current = null;
      setIsLoading(false);
    }
  };

  const runAddWalletFlow = async (provider: FaceSignSignerProvider) => {
    try {
      const publicKey = await provider.init();
      const signatureBytes = await provider.signMessage(ADD_WALLET_MESSAGE);
      const signature = hexEncode(signatureBytes, true);

      const walletPayload: WalletSignature = {
        address: publicKey,
        public_key: [publicKey],
        signature,
        message: ADD_WALLET_MESSAGE,
        wallet_type: "FaceSign",
      };

      const isValid = await verifySignature(walletPayload);
      if (!isValid) {
        toast.error("Invalid signature", {
          description: "The FaceSign signature could not be verified",
        });
        return;
      }

      await new Promise<void>((resolve, reject) => {
        addWalletMutation.mutate(
          {
            address: publicKey,
            publicKeys: [publicKey],
            signature,
            message: ADD_WALLET_MESSAGE,
            walletType: "FaceSign",
          },
          {
            onSuccess: () => {
              toast.success("FaceSign added", {
                description: "FaceSign has been added to your idOS profile",
              });
              resolve();
            },
            onError: (error) => {
              reject(error);
            },
          },
        );
      });
    } finally {
      provider.destroy();
      providerRef.current = null;
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="relative flex min-h-[120px] items-center gap-6 overflow-hidden rounded-xl border border-border bg-card p-5 lg:gap-10">
        <img
          src="/facesign-logo-light.svg"
          alt="idOS FaceSign"
          width={130}
          height={61}
          className="relative hidden shrink-0 lg:block dark:hidden"
        />
        <img
          src="/facesign-logo.svg"
          alt="idOS FaceSign"
          width={130}
          height={61}
          className="relative hidden shrink-0 lg:dark:block"
        />
        <div className="relative flex flex-1 flex-col gap-1">
          <h2 className="text-lg lg:text-xl dark:text-white">One Look. Full Control.</h2>
          <p className="text-muted-foreground text-sm dark:text-neutral-400">
            Create your idOS FaceSign wallet to access your data without passwords. Your face, your
            control.
          </p>
        </div>
        <Button
          className="relative min-w-[114px] shrink-0"
          isLoading={isLoading}
          onClick={handleCreateClick}
        >
          Create
        </Button>
      </div>
      <FacesignDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onContinue={handleContinue}
        isLoading={isLoading}
      />
      {isLoading && (
        <div className="fixed inset-0 z-9999 flex flex-col items-center justify-center gap-4 bg-background">
          <Spinner className="size-8" />
          <p className="text-center text-muted-foreground text-sm">Loading</p>
        </div>
      )}
    </>
  );
}
