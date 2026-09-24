/**
 * Attributes emitted by this instrumentation that have no stable OpenTelemetry
 * semantic convention. Stable ones (`db.*`, `error.type`) are imported from
 * `@opentelemetry/semantic-conventions` at the call site.
 */

/** Package the traced method lives in, e.g. `@idos-network/issuer`. */
export const ATTR_IDOS_SDK_PACKAGE = "idos.sdk.package";

/** Class the traced method lives on, e.g. `idOSIssuer`. */
export const ATTR_IDOS_SDK_CLASS = "idos.sdk.class";

/** Traced method name, e.g. `createUserProfile`. */
export const ATTR_IDOS_SDK_METHOD = "idos.sdk.method";

/** `db.system.name` value for the idOS kwil network. */
export const IDOS_KWIL_SYSTEM = "kwil";

/** Kwil namespace every idOS action runs against. */
export const IDOS_KWIL_NAMESPACE = "main";

/** Transaction hash returned by a kwil `execute`. */
export const ATTR_IDOS_KWIL_TX_HASH = "idos.kwil.tx_hash";

/** Whether a kwil `execute` waited for the transaction to be mined. */
export const ATTR_IDOS_KWIL_SYNCHRONOUS = "idos.kwil.synchronous";
