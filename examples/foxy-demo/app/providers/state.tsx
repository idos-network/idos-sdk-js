import {
  createIDOSClient,
  type idOSClientLoggedIn,
  type idOSClientWithUserSigner,
  type idOSCredential,
} from "@idos-network/client";
import { createActorContext } from "@xstate/react";
import { ethers } from "ethers";
import { assign, fromPromise, setup } from "xstate";
import { COMMON_ENV } from "./envFlags.common";

type Provider = "transak" | "banxa" | "custom" | null;

interface Context {
  walletAddress: string | null;
  provider: Provider;
  findCredentialsAttempts: number;
  kycUrl: string | null;
  profile: boolean | null;
  sharableToken: string | null;
  credentials: idOSCredential[] | null;
  client: idOSClientWithUserSigner | null;
  loggedInClient: idOSClientLoggedIn | null;
  accessGrant: idOSCredential | null;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  data: any | null;
}

export const machine = setup({
  types: {
    context: {} as Context,
  },
  actors: {
    createClient: fromPromise(async () => {
      const config = await createIDOSClient({
        enclaveOptions: { container: "#idOS-enclave" },
        // nodeUrl: "https://nodes.staging.idos.network",
        nodeUrl: "http://localhost:8484",
      });

      const idleClient = await config.createClient();

      // @ts-expect-error
      const signer = await new ethers.BrowserProvider(window.ethereum).getSigner();

      const withUserSigner = await idleClient.withUserSigner(signer);

      return withUserSigner;
    }),
    checkProfile: fromPromise(async ({ input }: { input: idOSClientWithUserSigner | null }) => {
      if (!input) {
        throw new Error("Client not found");
      }

      const hasProfile = await input.hasProfile();

      if (!hasProfile) {
        throw new Error("No profile found");
      }

      return hasProfile;
    }),
    loginClient: fromPromise(async ({ input }: { input: idOSClientWithUserSigner | null }) => {
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
    createSharableToken: fromPromise(async ({ input }: { input: idOSCredential | null }) => {
      const kycUrl = await fetch(`/app/kyc/token?idosCredentialsId=${input?.id}`);
      const tokenData = await kycUrl.json();
      return tokenData.token;
    }),
    findCredentials: fromPromise(async ({ input }: { input: idOSClientLoggedIn | null }) => {
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

      console.log(credentials);

      return credentials;
    }),
    requestAccessGrant: fromPromise(
      async ({
        input,
      }: {
        input: { client: idOSClientLoggedIn | null; credentials: idOSCredential[] | null };
      }) => {
        if (!input.client) {
          throw new Error("Client not found");
        }

        if (!input.credentials || input.credentials.length === 0) {
          throw new Error("No credentials found");
        }

        // TODO: Better filtering (level++)

        // Check if we already have an access grant for this credential
        const grants = await input.client
          .getAccessGrantsOwned()
          .then((x) =>
            x.filter((g) => g.ag_grantee_wallet_identifier === COMMON_ENV.IDOS_PUBLIC_KEY),
          );

        // If yes we can use it, otherwise we need to request a new one
        if (grants.length > 0) {
          return grants[0];
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
      }: { input: { client: idOSClientLoggedIn | null; accessGrant: idOSCredential | null } }) => {
        if (!input.client || !input.accessGrant) {
          throw new Error("Client or access grant not found");
        }

        await input.client.revokeAccessGrant(input.accessGrant.id);
      },
    ),
    fetchUserData: fromPromise(async ({ input }: { input: idOSCredential | null }) => {
      if (!input) {
        throw new Error("Credential not found");
      }

      // @ts-expect-error Missing types
      const data = await fetch(`/app/kyc/data?credentialsId=${input.data_id ?? input.id}`);

      return await data.json();
    }),
  },
  actions: {
    configure: assign({
      walletAddress: ({ event }) => event.address,
      provider: ({ event }) => event.provider,
    }),
    reset: assign({
      walletAddress: null,
      provider: null,
      kycUrl: null,
      client: null,
      profile: null,
      loggedInClient: null,
      sharableToken: null,
      credentials: [],
      accessGrant: null,
      findCredentialsAttempts: 0,
      data: null,
    }),
    setClient: assign({
      client: ({ event }) => event.output,
    }),
    setKycUrl: assign({
      kycUrl: ({ event }) => event.output,
    }),
    setLoggedInClient: assign({
      loggedInClient: ({ event }) => event.output,
    }),
    setCredentials: assign({
      credentials: ({ event }) => event.output,
    }),
    incrementFindCredentialsAttempts: assign({
      findCredentialsAttempts: ({ context }) => context.findCredentialsAttempts + 1,
    }),
    setAccessGrant: assign({
      accessGrant: ({ event }) => event.output,
    }),
    setSharableToken: assign({
      sharableToken: ({ event }) => event.output,
    }),
    setUserData: assign({
      data: ({ event }) => event.output,
    }),
  },
}).createMachine({
  id: "idos",
  initial: "notConfigured",
  context: {
    walletAddress: null,
    provider: null,
    kycUrl: null,
    client: null,
    profile: null,
    loggedInClient: null,
    sharableToken: null,
    credentials: [],
    accessGrant: null,
    findCredentialsAttempts: 0,
    data: null,
  },
  states: {
    notConfigured: {
      on: {
        configure: {
          actions: ["configure"],
          target: "createClient",
        },
      },
    },
    createClient: {
      invoke: {
        id: "createClient",
        src: "createClient",
        onDone: {
          target: "checkProfile",
          actions: ["setClient"],
        },
        onError: {
          target: "error",
        },
      },
    },
    checkProfile: {
      invoke: {
        id: "checkProfile",
        src: "checkProfile",
        input: ({ context }) => context.client,
        onDone: {
          target: "login",
          actions: assign({
            profile: true,
          }),
        },
        onError: {
          target: "startKYC",
          actions: assign({
            profile: false,
          }),
        },
      },
    },
    startKYC: {
      invoke: {
        id: "startKYC",
        src: "startKYC",
        onDone: {
          target: "waitForKYC",
          actions: "setKycUrl",
        },
        onError: {
          target: "error",
        },
      },
    },
    waitForKYC: {
      on: {
        kycCompleted: {
          target: "login",
          actions: "setKycUrl",
        },
      },
    },
    login: {
      invoke: {
        id: "loginClient",
        src: "loginClient",
        input: ({ context }) => context.client,
        onDone: {
          target: "findCredentials",
          actions: ["setLoggedInClient"],
        },
        onError: {
          target: "error",
        },
      },
    },
    findCredentials: {
      invoke: {
        id: "findCredentials",
        src: "findCredentials",
        input: ({ context }) => context.loggedInClient,
        onDone: [
          {
            actions: ["setCredentials"],
            target: "requestAccessGrant",
          },
        ],
        onError: [
          {
            guard: ({ context }) => context.kycUrl !== null,
            // Kraken needs some time to store the credentials
            target: "waitForCredentials",
            actions: ["incrementFindCredentialsAttempts"],
          },
          {
            guard: ({ context }) => context.kycUrl === null,
            target: "startKYC",
          },
        ],
      },
    },
    waitForCredentials: {
      after: {
        2000: "findCredentials",
      },
      always: {
        guard: ({ context }) => context.findCredentialsAttempts >= 20,
        target: "error",
        meta: {
          message: "Find credentials timeout",
        },
      },
    },
    requestAccessGrant: {
      invoke: {
        id: "requestAccessGrant",
        src: "requestAccessGrant",
        input: ({ context }) => ({
          client: context.loggedInClient,
          credentials: context.credentials,
        }),
        onDone: {
          actions: ["setAccessGrant"],
          target: "accessGranted",
        },
        onError: {
          target: "error",
        },
      },
    },
    accessGranted: {
      on: {
        getSharableToken: {
          target: "createSharableToken",
        },
        fetchUserData: {
          target: "fetchUserData",
        },
      },
    },
    createSharableToken: {
      invoke: {
        id: "createSharableToken",
        src: "createSharableToken",
        input: ({ context }) => context.credentials?.[0] as idOSCredential,
        onDone: {
          target: "dataOrTokenFetched",
          actions: ["setSharableToken"],
        },
        onError: {
          target: "error",
          meta: {
            message: "Create sharable token error",
          },
        },
      },
    },
    fetchUserData: {
      invoke: {
        id: "fetchUserData",
        src: "fetchUserData",
        input: ({ context }) => context.accessGrant,
        onDone: {
          target: "dataOrTokenFetched",
          actions: ["setUserData"],
        },
        onError: {
          target: "error",
          meta: {
            message: "Fetch user data error",
          },
        },
      },
    },
    dataOrTokenFetched: {
      on: {
        revokeAccessGrant: {
          target: "revokeAccessGrant",
        },
      },
    },
    revokeAccessGrant: {
      invoke: {
        id: "revokeAccessGrant",
        src: "revokeAccessGrant",
        input: ({ context }) => ({
          client: context.loggedInClient,
          accessGrant: context.accessGrant,
        }),
      },
      onDone: {
        target: "notConfigured",
        actions: ["reset"],
      },
      onError: {
        target: "error",
      },
    },
    done: {
      // todo
    },
    error: {
      type: "final",
    },
  },
  on: {
    RESET: {
      actions: ["reset"],
      target: ".notConfigured",
    },
  },
});

export const MachineContext = createActorContext(machine);

export function MachineProvider({ children }: { children: React.ReactNode }) {
  return <MachineContext.Provider>{children}</MachineContext.Provider>;
}
