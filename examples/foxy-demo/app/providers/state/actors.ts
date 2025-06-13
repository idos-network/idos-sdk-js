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

  createSharableToken: fromPromise(async ({ input }: { input: Context["credential"] }) => {
    if (!input) {
      throw new Error("Credential not found");
    }

    const kycUrl = await fetch(`/app/kyc/token?credentialId=${input.id}`);

    if (kycUrl.status !== 200) {
      throw new Error("KYC API is not available. Please try again later.");
    }

    const tokenData = await kycUrl.json();
    return tokenData.token;
  }),

  findCredential: fromPromise(async ({ input }: { input: Context["loggedInClient"] }) => {
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
      publicNotesFieldFilters: {
        pick: { level: [COMMON_ENV.KRAKEN_LEVEL] },
        omit: {},
      },
    });

    if (credentials.length === 0) {
      throw new Error("No credentials found, start the KYC process");
    }

    return credentials[0];
  }),

  requestAccessGrant: fromPromise(
    async ({
      input,
    }: {
      input: { client: Context["loggedInClient"]; credential: Context["credential"] };
    }) => {
      if (!input.client) {
        throw new Error("Client not found");
      }

      if (!input.credential) {
        throw new Error("No credential found");
      }

      const id = input.credential.id;

      const sharedCredential = await input.client.requestAccessGrant(id, {
        consumerEncryptionPublicKey: COMMON_ENV.IDOS_ENCRYPTION_PUBLIC_KEY,
        consumerAuthPublicKey: COMMON_ENV.IDOS_PUBLIC_KEY,
      });

      return sharedCredential;
    },
  ),

  revokeAccessGrant: fromPromise(
    async ({
      input,
    }: {
      input: { client: Context["loggedInClient"]; sharedCredential: Context["sharedCredential"] };
    }) => {
      if (!input.client || !input.sharedCredential) {
        throw new Error("Client or access grant not found");
      }

      const accessGrants = await input.client.getAccessGrantsOwned();
      const accessGrant = accessGrants.find((ag) => ag.data_id === input.sharedCredential?.id);

      if (!accessGrant) {
        throw new Error("Access grant not found");
      }

      await input.client.revokeAccessGrant(accessGrant.id);
    },
  ),

  createNoahCustomer: fromPromise(async ({ input }: { input: Context["sharedCredential"] }) => {
    if (!input) {
      throw new Error("Credential not found");
    }

    const customer = await fetch(`/app/kyc/noah?credentialId=${input.id}`);

    if (customer.status !== 200) {
      throw new Error("Noah API is not available. Please try again later.");
    }

    const data = await customer.json();

    return data.url;
  }),

  fetchUserData: fromPromise(async ({ input }: { input: Context["sharedCredential"] }) => {
    if (!input) {
      throw new Error("Credential not found");
    }

    const data = await fetch(`/app/kyc/data?credentialId=${input.id}`);

    return await data.json();
  }),
};
