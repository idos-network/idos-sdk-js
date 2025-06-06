import { createIDOSClient } from "@idos-network/client";
import { ethers } from "ethers";
import { fromPromise } from "xstate";
import { COMMON_ENV } from "../envFlags.common";
import type { Context } from "./types";

export const actors = {
  createClient: fromPromise(async () => {
    const config = await createIDOSClient({
      enclaveOptions: { container: "#idOS-enclave" },
      nodeUrl: COMMON_ENV.IDOS_NODE_URL,
    });

    const idleClient = await config.createClient();

    // @ts-expect-error
    const signer = await new ethers.BrowserProvider(window.ethereum).getSigner();

    const withUserSigner = await idleClient.withUserSigner(signer);

    return withUserSigner;
  }),

  checkProfile: fromPromise(async ({ input }: { input: Context["client"] }) => {
    if (!input) {
      throw new Error("Client not found");
    }

    const hasProfile = await input.hasProfile();

    if (!hasProfile) {
      throw new Error("No profile found");
    }

    return hasProfile;
  }),

  loginClient: fromPromise(async ({ input }: { input: Context["client"] }) => {
    if (!input) {
      throw new Error("Client not found");
    }

    return await input.logIn();
  }),

  startKYC: fromPromise(async () => {
    const kycUrl = await fetch("/app/kyc/link");
    const kycUrlData = await kycUrl.json();
    return kycUrlData.url;
  }),

  createSharableToken: fromPromise(async ({ input }: { input: Context["accessGrant"] }) => {
    if (!input) {
      throw new Error("Credential not found");
    }

    // @ts-expect-error Missing types
    const kycUrl = await fetch(`/app/kyc/token?credentialsId=${input.data_id ?? input.id}`);

    if (kycUrl.status !== 200) {
      throw new Error("KYC API is not available. Please try again later.");
    }

    const tokenData = await kycUrl.json();
    return tokenData.token;
  }),

  findCredentials: fromPromise(async ({ input }: { input: Context["loggedInClient"] }) => {
    if (!input) {
      throw new Error("Client not found");
    }

    const credentials = await input.filterCredentials({
      acceptedIssuers: [
        {
          // Kraken
          authPublicKey: COMMON_ENV.KRAKEN_ISSUER_PUBLIC_KEY,
        },
      ],
    });

    if (credentials.length === 0) {
      throw new Error("No credentials found, start the KYC process");
    }

    return credentials;
  }),

  requestAccessGrant: fromPromise(
    async ({
      input,
    }: {
      input: { client: Context["loggedInClient"]; credentials: Context["credentials"] };
    }) => {
      if (!input.client) {
        throw new Error("Client not found");
      }

      if (!input.credentials || input.credentials.length === 0) {
        throw new Error("No credentials found");
      }

      const id = input.credentials[0].id;

      const ag = await input.client.requestAccessGrant(id, {
        consumerEncryptionPublicKey: COMMON_ENV.IDOS_ENCRYPTION_PUBLIC_KEY,
        consumerAuthPublicKey: COMMON_ENV.IDOS_PUBLIC_KEY,
      });

      return ag;
    },
  ),

  revokeAccessGrant: fromPromise(
    async ({
      input,
    }: {
      input: { client: Context["loggedInClient"]; accessGrant: Context["accessGrant"] };
    }) => {
      if (!input.client || !input.accessGrant) {
        throw new Error("Client or access grant not found");
      }

      await input.client.revokeAccessGrant(input.accessGrant.id);
    },
  ),

  fetchUserData: fromPromise(async ({ input }: { input: Context["accessGrant"] }) => {
    if (!input) {
      throw new Error("Credential not found");
    }

    // @ts-expect-error Missing types
    const data = await fetch(`/app/kyc/data?credentialsId=${input.data_id ?? input.id}`);

    return await data.json();
  }),
};
