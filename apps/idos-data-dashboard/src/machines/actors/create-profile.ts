import { hexEncode } from "@idos-network/utils/codecs";
import { fromPromise } from "xstate";

import type { ProfileData } from "@/routes/api/profile";

import type { CreateProfileInput, CreateProfileOutput } from "../dashboard/machine";

export const createProfile = fromPromise<CreateProfileOutput, CreateProfileInput>(
  async ({ input }) => {
    try {
      const { client } = input;

      // Fetch the user ID and a proof message from the server
      const { userId, proofMessage } = await fetch("/api/profile").then((res) => res.json());

      let signature = await client.signer?.signMessage?.(proofMessage);
      const encryptionProfile = await client.createUserEncryptionProfile(userId);

      if (!signature) {
        throw new Error("Failed to sign proof message");
      }

      if (signature instanceof Uint8Array) {
        // FaceSign returns an array of bytes
        signature = hexEncode(signature);
      } else if (typeof signature === "string" && !signature.startsWith("0x")) {
        signature = `0x${signature}`;
      }

      const profileData: ProfileData = {
        recipientEncryptionPublicKey: encryptionProfile.userEncryptionPublicKey,
        encryptionPasswordStore: encryptionProfile.encryptionPasswordStore,
        walletAddress: client.walletIdentifier,
        // This is ok, that it differentiate from the response
        // for idOS this is mandatory, for UI we need public key...
        walletPublicKey: client.walletPublicKey ?? "",
        walletType: client.walletType,
        signature: signature as string,
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
        throw new Error("Failed to create profile");
      }

      return {
        walletAddress: client.walletIdentifier,
        walletPublicKey: client.walletPublicKey ?? client.walletIdentifier,
        walletType: client.walletType,
        nearSelector: null,
      };
    } catch (error) {
      console.error("Failed to create profile", error);
      throw error;
    }
  },
);
