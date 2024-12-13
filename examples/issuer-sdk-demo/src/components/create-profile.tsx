"use client";

import { Button } from "@nextui-org/react";
import { useState } from "react";
import { useAccount, useSignMessage } from "wagmi";

import { createProfile } from "@/actions";
import { useSdkStore } from "@/stores/sdk";
import type { CreateWalletReqParams } from "@idos-network/issuer-sdk-js";

export function CreateProfile({ onSuccess }: { onSuccess: () => void }) {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [loadingMessage, setLoadingMessage] = useState("");
  const { sdk: idOSSDK } = useSdkStore();

  const handleSubmit = async () => {
    try {
      if (!idOSSDK) throw new Error("No SDK found");
      setLoadingMessage("Creating user password...");
      const humanId = crypto.randomUUID();
      const { userEncryptionPublicKey } =
        await idOSSDK.enclave.provider.discoverUserEncryptionPublicKey(humanId);

      setLoadingMessage("Signing message on your wallet...");

      const message = `Sign this message to confirm that you own this wallet address.\nHere's a unique nonce: ${crypto.randomUUID()}`;
      const signature = await signMessageAsync({
        message,
      });

      setLoadingMessage("Creating your profile...");

      await createProfile(userEncryptionPublicKey, humanId, {
        address: address as string,
        signature,
        message,
        wallet_type: "EVM",
        public_key: "",
      } as CreateWalletReqParams);
      onSuccess();
    } catch (error) {
      console.log({ error });
    } finally {
      setLoadingMessage("");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-semibold">Create an idOS profile</h2>
      <Button
        onClick={handleSubmit}
        color="primary"
        variant="bordered"
        isLoading={!!loadingMessage}
      >
        {loadingMessage || "Create profile"}
      </Button>
    </div>
  );
}
