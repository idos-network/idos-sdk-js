import { hexEncode } from "@idos-network/utils/codecs";
import { fromPromise } from "xstate";
import type { ProfileData } from "@/routes/api/profile";
import type { CreateFacesignProfileInput, CreateFacesignProfileOutput } from "../dashboard.machine";

export const createFacesignProfile = fromPromise<
  CreateFacesignProfileOutput,
  CreateFacesignProfileInput
>(async ({ input }) => {
  try {
    const { client } = input;

    console.log("client", client);

    // Fetch the user ID and a proof message from the server
    const { userId, proofMessage } = await fetch("/api/profile").then((res) => res.json());

    const signature = await client.signer?.signMessage?.(proofMessage);
    const encryptionProfile = await client.createUserEncryptionProfile(userId);

    const profileData: ProfileData = {
      recipientEncryptionPublicKey: encryptionProfile.userEncryptionPublicKey,
      encryptionPasswordStore: encryptionProfile.encryptionPasswordStore,
      walletAddress: client.walletIdentifier,
      walletPublicKey: client.walletPublicKey ?? "",
      signature: hexEncode(signature as Uint8Array),
    };

    // Call the API to create the profile
    const response = await fetch("/api/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      throw new Error("Failed to create Facesign profile");
    }

    return {
      walletAddress: client.walletIdentifier,
      walletPublicKey: client.walletPublicKey ?? "",
      walletType: client.walletType,
      nearSelector: null,
    };
  } catch (error) {
    console.error("Failed to create Facesign profile", error);
    throw error;
  }
});
