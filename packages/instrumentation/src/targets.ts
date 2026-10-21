import type { Attributes } from "@opentelemetry/api";

import { SpanKind } from "@opentelemetry/api";
import {
  ATTR_DB_NAMESPACE,
  ATTR_DB_OPERATION_NAME,
  ATTR_DB_SYSTEM_NAME,
} from "@opentelemetry/semantic-conventions";

import {
  ATTR_IDOS_KWIL_SYNCHRONOUS,
  ATTR_IDOS_KWIL_TX_HASH,
  IDOS_KWIL_NAMESPACE,
  IDOS_KWIL_SYSTEM,
} from "./semconv";

/** A method to wrap. A bare string uses every default. */
export type MethodTarget = {
  name: string;
  /** Span name. Defaults to `<Class>.<method>`, or `<method>` for a function export. */
  spanName?: (args: readonly unknown[]) => string;
  /** Attributes derived from the arguments. Must not emit personal data. */
  attributes?: (args: readonly unknown[]) => Attributes;
  /** Attributes derived from the resolved value. Must not emit personal data. */
  responseAttributes?: (result: unknown) => Attributes;
  /** @default SpanKind.INTERNAL */
  kind?: SpanKind;
};

export type ClassTarget = {
  /** Name of the class as exported by the module. */
  className: string;
  /** Instance methods, wrapped on the prototype. */
  methods: (string | MethodTarget)[];
  /** Static methods, wrapped on the constructor (`init`-style factories). */
  staticMethods?: (string | MethodTarget)[];
};

export type ModuleTarget = {
  /** Module specifier. */
  name: string;
  supportedVersions: string[];
  /**
   * Only classes. Every method lives on a prototype or a constructor, both of
   * which are ordinary mutable objects — that is what lets
   * {@link IdosInstrumentation.patchModuleExports} work without a loader hook.
   * A bare function export would sit on the sealed module namespace instead,
   * and could only be reached via `import-in-the-middle`.
   */
  classes: ClassTarget[];
};

const SUPPORTED = [">=2.0.0 <3"];

/**
 * Kwil `call`/`execute` are the idOS equivalent of `pg.Client.query`: every SDK
 * operation bottoms out here. The action name is a fixed identifier from the
 * action schema, so it is safe to record; the inputs are not.
 */
const kwilAttributes = (args: readonly unknown[]): Attributes => {
  const params = args[0] as { name?: unknown } | undefined;
  return {
    [ATTR_DB_SYSTEM_NAME]: IDOS_KWIL_SYSTEM,
    [ATTR_DB_NAMESPACE]: IDOS_KWIL_NAMESPACE,
    ...(typeof params?.name === "string" ? { [ATTR_DB_OPERATION_NAME]: params.name } : {}),
  };
};

const kwilSpanName =
  (operation: string) =>
  (args: readonly unknown[]): string => {
    const params = args[0] as { name?: unknown } | undefined;
    return typeof params?.name === "string"
      ? `idos.kwil.${operation} ${params.name}`
      : `idos.kwil.${operation}`;
  };

/** Methods shared by every logged-out-capable client state. */
const CLIENT_LOGGED_IN_METHODS = [
  "requestDWGMessage",
  "createCredential",
  "removeCredential",
  "getCredentialById",
  "shareCredential",
  "getAllCredentials",
  "getAccessGrantsOwned",
  "getAttributes",
  "createAttribute",
  "getCredentialContentSha256Hash",
  "getCredentialContent",
  "getCredentialWithEncryptedContent",
  "getCredentialSharedContent",
  "getGrants",
  "getGrantsCount",
  "getCredentialShared",
  "revokeAccessGrant",
  "addWallet",
  "addWallets",
  "getWallets",
  "removeWallet",
  "removeWallets",
  "filterCredentials",
  "requestAccessGrant",
  "logOut",
];

export const TARGETS: ModuleTarget[] = [
  {
    name: "@idos-network/kwil-infra",
    supportedVersions: SUPPORTED,
    classes: [
      {
        className: "KwilActionClient",
        methods: [
          {
            name: "call",
            kind: SpanKind.CLIENT,
            spanName: kwilSpanName("call"),
            attributes: kwilAttributes,
          },
          {
            name: "execute",
            kind: SpanKind.CLIENT,
            spanName: kwilSpanName("execute"),
            attributes: (args) => ({
              ...kwilAttributes(args),
              // `synchronous` defaults to true and also decides whether the span
              // covers the tx-confirmation polling loop.
              [ATTR_IDOS_KWIL_SYNCHRONOUS]: args[2] === undefined ? true : Boolean(args[2]),
            }),
            responseAttributes: (result) =>
              typeof result === "string" ? { [ATTR_IDOS_KWIL_TX_HASH]: result } : {},
          },
          {
            // Usually the bulk of an `execute`: polling the node until the tx is
            // mined. A tx hash is a public chain identifier, so it is safe to record.
            name: "waitForTx",
            kind: SpanKind.CLIENT,
            spanName: () => "idos.kwil.waitForTx",
            attributes: (args) => ({
              [ATTR_DB_SYSTEM_NAME]: IDOS_KWIL_SYSTEM,
              [ATTR_DB_NAMESPACE]: IDOS_KWIL_NAMESPACE,
              ...(typeof args[0] === "string" ? { [ATTR_IDOS_KWIL_TX_HASH]: args[0] } : {}),
            }),
          },
        ],
      },
    ],
  },
  {
    name: "@idos-network/client",
    supportedVersions: SUPPORTED,
    classes: [
      { className: "idOSClientConfiguration", methods: ["createClient"] },
      {
        className: "idOSClientIdle",
        methods: ["addressHasProfile", "withUserSigner", "logOut"],
        staticMethods: ["fromConfig"],
      },
      {
        className: "idOSClientWithUserSigner",
        methods: ["hasProfile", "createUserEncryptionProfile", "logIn", "logOut"],
      },
      { className: "idOSClientLoggedIn", methods: CLIENT_LOGGED_IN_METHODS },
    ],
  },
  {
    name: "@idos-network/issuer",
    supportedVersions: SUPPORTED,
    classes: [
      {
        className: "idOSIssuer",
        staticMethods: ["init"],
        methods: [
          "hasProfile",
          "createUserProfile",
          "upsertWalletAsInserter",
          "createUser",
          "getUser",
          "requestDelegatedWriteGrantMessage",
          "createCredentialByDelegatedWriteGrant",
          "editCredentialAsIssuer",
          "getCredentialIdByContentHash",
          "getCredentialShared",
        ],
      },
    ],
  },
  {
    name: "@idos-network/consumer",
    supportedVersions: SUPPORTED,
    classes: [
      {
        className: "idOSConsumer",
        staticMethods: ["init"],
        methods: [
          "getCredentialSharedFromIDOS",
          "getCredentialSharedContentDecrypted",
          "rescindSharedCredential",
          "getGrantsCount",
          "getAccessGrantsForCredential",
          "getCredentialsSharedByUser",
          "getAccessGrants",
          "verifyCredential",
        ],
      },
    ],
  },
];
