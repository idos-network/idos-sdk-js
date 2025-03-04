"use server";
import { getIssuerConfig } from "@/issuer.config";
import { createUser } from "@idos-network/issuer-sdk-js/server";

export async function createIDOSUserProfile({
  userId,
  recipientEncryptionPublicKey,
  wallet,
}: {
  userId: string;
  recipientEncryptionPublicKey: string;
  wallet: {
    address: string;
    type: "EVM";
    message: string;
    signature: string;
    publicKey: string;
  };
}) {
  const config = await getIssuerConfig();

  const user = await createUser(
    config,
    {
      id: userId,
      recipient_encryption_public_key: recipientEncryptionPublicKey,
    },
    {
      address: wallet.address,
      wallet_type: wallet.type,
      message: wallet.message,
      signature: wallet.signature,
      public_key: "",
    },
  );

  return user;
}
