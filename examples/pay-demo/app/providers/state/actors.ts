import { createIDOSClient } from "@idos-network/client";
import { parseLevel } from "@idos-network/credentials/utils";
import { ethers } from "ethers";
import { fromPromise } from "xstate";
import { COMMON_ENV } from "../envFlags.common";
import type { Context } from "./types";

export const actors = {
  createClient: fromPromise(async () => {
    const config = await createIDOSClient({
      enclaveOptions: { url: "https://enclave.playground.idos.network/" },
      nodeUrl: COMMON_ENV.IDOS_NODE_URL,
    });

    const idleClient = await config.createClient();

    // @ts-expect-error
    const signer = await new ethers.BrowserProvider(window.ethereum).getSigner();

    return await idleClient.withUserSigner(signer);
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

  startKYC: fromPromise(async ({ input }: { input: Context["kycType"] }) => {
    const kycUrl = await fetch(`/app/kyc/link?type=${input}`);
    const kycUrlData = await kycUrl.json();
    return kycUrlData.url;
  }),

  requestKrakenDAG: fromPromise(
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

      const krakenSharedCredential = await input.client.requestAccessGrant(id, {
        consumerEncryptionPublicKey: COMMON_ENV.KRAKEN_ENCRYPTION_PUBLIC_KEY,
        consumerAuthPublicKey: COMMON_ENV.KRAKEN_PUBLIC_KEY,
      });

      return krakenSharedCredential;
    },
  ),

  createMoneriumUser: fromPromise(async ({ input }: { input: Context["sharedCredential"] }) => {
    if (!input) {
      throw new Error("Credential not found");
    }

    const moneriumUser = await fetch(`/app/kyc/monerium/user?credentialId=${input.id}`);

    if (moneriumUser.status !== 200) {
      throw new Error("User was not created, or already exists.");
    }

    return await moneriumUser.json().then((data) => data.url);
  }),

  requestMoneriumAuth: fromPromise(async ({ input }: { input: Context["sharedCredential"] }) => {
    if (!input) {
      throw new Error("Credential not found");
    }

    const moneriumAuth = await fetch(`/app/kyc/monerium/auth?credentialId=${input.id}`);

    if (moneriumAuth.status !== 200) {
      throw new Error("Monerium API is not available. Please try again later.");
    }

    return await moneriumAuth.json().then((data) => data.url);
  }),

  moneriumAccessTokenFromCode: fromPromise(
    async ({ input }: { input: Context["moneriumCode"] }) => {
      if (!input) {
        throw new Error("Monerium code not found");
      }

      const moneriumAuth = await fetch(`/app/kyc/monerium/code?code=${input}`);

      if (moneriumAuth.status !== 200) {
        throw new Error("Monerium API is not available. Please try again later.");
      }

      return true;
    },
  ),

  createMoneriumProfile: fromPromise(async ({ input }: { input: Context["sharedCredential"] }) => {
    if (!input) {
      throw new Error("Credential not found");
    }

    const moneriumProfile = await fetch(`/app/kyc/monerium/profile?credentialId=${input.id}`);

    if (moneriumProfile.status !== 200) {
      throw new Error("Monerium API is not available. Please try again later.");
    }

    return true;
  }),

  fetchMoneriumProfileStatus: fromPromise(async () => {
    const moneriumProfileStatus = await fetch("/app/kyc/monerium/status");

    if (moneriumProfileStatus.status !== 200) {
      throw new Error("Monerium API is not available. Please try again later.");
    }

    const data = await moneriumProfileStatus.json();

    if (data.state !== "approved") {
      throw new Error("KYC is not active, please try again later.");
    }

    return data;
  }),

  createSharableToken: fromPromise(
    async ({ input }: { input: { dag: Context["krakenDAG"]; provider: string } }) => {
      if (!input) {
        throw new Error("Credential not found");
      }

      const response = await fetch(
        `/app/kyc/token?credentialId=${input.dag?.id}&provider=${input.provider}`,
      );

      if (response.status !== 200) {
        throw new Error("KYC API is not available. Please try again later.");
      }

      const tokenData = await response.json();
      // Return the full token response (id, kycStatus, token, forClientId)
      return tokenData;
    },
  ),

  checkCredentialStatus: fromPromise(async ({ input }: { input: Context["transakTokenData"] }) => {
    if (!input) {
      throw new Error("Transak token data not found");
    }

    const response = await fetch(`/app/kyc/credential-status?credentialId=${input.id}`);

    if (response.status !== 200) {
      throw new Error("Failed to check credential status.");
    }

    const data = await response.json();

    if (data.kycStatus?.toLowerCase() === "pending") {
      throw new Error("KYC status is still pending");
    }

    return data;
  }),

  fetchTransakWidgetUrl: fromPromise(
    async ({
      input,
    }: {
      input: {
        walletAddress: Context["walletAddress"];
        transakTokenData: Context["transakTokenData"];
        sharedCredential: Context["sharedCredential"];
      };
    }) => {
      if (!input.walletAddress || !input.transakTokenData || !input.sharedCredential) {
        throw new Error("Missing required data for Transak widget URL");
      }

      const response = await fetch("/app/kyc/widget-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: input.walletAddress,
          fiatAmount: "100",
          kycShareToken: input.transakTokenData.token,
          credentialId: input.sharedCredential.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error ?? "Failed to create Transak widget URL");
      }

      const data = await response.json();
      return data.widgetUrl;
    },
  ),

  findCredential: fromPromise(async ({ input }: { input: Context["loggedInClient"] }) => {
    if (!input) {
      throw new Error("Client not found");
    }

    const { base: level, addons } = parseLevel(COMMON_ENV.KRAKEN_LEVEL);

    const credentials = await input.filterCredentials({
      acceptedIssuers: [
        {
          // Kraken
          authPublicKey: COMMON_ENV.KRAKEN_PUBLIC_KEY,
        },
      ],
      credentialLevelOrHigherFilter: {
        userLevel: level,
        requiredAddons: addons,
      },
    });

    // TODO: Add missing sort by level score

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

      return true;
    },
  ),

  createHifiTocLink: fromPromise(async () => {
    const hifiTocLink = await fetch("/app/kyc/hifi/tos");

    if (hifiTocLink.status !== 200) {
      throw new Error("Hifi API is not available. Please try again later.");
    }

    const data = await hifiTocLink.json();

    return data.link;
  }),

  verifyHifiTos: fromPromise(
    async ({
      input,
    }: {
      input: { hifiTosId: Context["hifiTosId"]; sharedCredential: Context["sharedCredential"] };
    }) => {
      if (!input.hifiTosId || !input.sharedCredential) {
        throw new Error("Hifi TOS ID or Shared credentials not found");
      }

      const hifiUrl = await fetch(
        `/app/kyc/hifi/link?credentialId=${input.sharedCredential.id}&signedAgreementId=${input.hifiTosId}`,
      );

      if (hifiUrl.status !== 200) {
        const text = await hifiUrl.text();
        throw new Error(`Hifi API is not available. Please try again later. ${text}`);
      }

      const data = await hifiUrl.json();

      return data.url;
    },
  ),

  getHifiKycStatus: fromPromise(async () => {
    const hifiKycStatus = await fetch("/app/kyc/hifi/status");

    if (hifiKycStatus.status !== 200) {
      throw new Error("Hifi API is not available. Please try again later.");
    }

    const data = await hifiKycStatus.json();

    if (data.status !== "ACTIVE") {
      throw new Error("KYC is not active, please try again later.");
    }

    return data.status;
  }),

  createOnRampAccount: fromPromise(async () => {
    const onRampAccount = await fetch("/app/kyc/hifi/account");

    if (onRampAccount.status !== 200) {
      throw new Error("Hifi API is not available. Please try again later.");
    }

    return await onRampAccount.json();
  }),

  createNoahCustomer: fromPromise(
    async ({
      input,
    }: {
      input: {
        sharedCredential: Context["sharedCredential"];
        krakenDAG: Context["krakenDAG"];
      };
    }) => {
      if (!input?.sharedCredential || !input?.krakenDAG) {
        throw new Error("Credential not found");
      }

      const customer = await fetch(
        `/app/kyc/noah/link?credentialId=${input.sharedCredential.id}&krakenDAG=${input.krakenDAG.id}`,
      );

      if (customer.status !== 200) {
        const text = await customer.text();
        throw new Error(`Noah API is not available. Please try again later. (Reason: ${text})`);
      }

      const data = await customer.json();

      return data.url;
    },
  ),

  createDueAccount: fromPromise(
    async ({
      input,
    }: {
      input: {
        sharedCredential: Context["sharedCredential"];
      };
    }) => {
      if (!input) {
        throw new Error("Due token data not found");
      }

      const dueAccount = await fetch(
        `/app/kyc/due/account?credentialId=${input.sharedCredential?.id}`,
      );

      if (dueAccount.status !== 200) {
        throw new Error("Due API is not available. Please try again later.");
      }

      return await dueAccount.json();
    },
  ),

  acceptDueTosAndShareToken: fromPromise(
    async ({
      input,
    }: {
      input: {
        dueTokenData: Context["dueTokenData"];
        dueTosToken: Context["dueTosToken"];
      };
    }) => {
      if (!input) {
        throw new Error("Due token data not found");
      }

      const dueAccount = await fetch(
        `/app/kyc/due/confirm?tosToken=${input.dueTosToken}&sumSubToken=${input.dueTokenData?.token}`,
      );

      if (dueAccount.status !== 200) {
        throw new Error("Due API is not available. Please try again later.");
      }

      return await dueAccount.json();
    },
  ),

  checkDueKycStatus: fromPromise(async () => {
    const dueKycStatus = await fetch("/app/kyc/due/done");

    if (dueKycStatus.status !== 200) {
      throw new Error("Due KYC is not done.");
    }

    return await dueKycStatus.json();
  }),
};
