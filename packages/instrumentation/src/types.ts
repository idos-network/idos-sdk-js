import type { Span } from "@opentelemetry/api";
import type { InstrumentationConfig } from "@opentelemetry/instrumentation";

/** Data about the call that is about to be made, passed to {@link IdosInstrumentationConfig.requestHook}. */
export type IdosRequestHookInformation = {
  /** Module the traced method was exported from, e.g. `@idos-network/issuer`. */
  moduleName: string;
  /** Class the method lives on, or `undefined` for a bare function export. */
  className: string | undefined;
  /** Method name, e.g. `createUserProfile`. */
  methodName: string;
  /** The arguments the method was called with. May contain personal data — see README. */
  args: readonly unknown[];
};

/** Data about the completed call, passed to {@link IdosInstrumentationConfig.responseHook}. */
export type IdosResponseHookInformation = {
  moduleName: string;
  className: string | undefined;
  methodName: string;
  /** The resolved return value. May contain personal data — see README. */
  result: unknown;
};

export type IdosInstrumentationRequestHook = (span: Span, info: IdosRequestHookInformation) => void;

export type IdosInstrumentationResponseHook = (
  span: Span,
  info: IdosResponseHookInformation,
) => void;

export interface IdosInstrumentationConfig extends InstrumentationConfig {
  /**
   * Hook for adding custom attributes from the call arguments, or renaming the span.
   *
   * Nothing derived from arguments is recorded by default: idOS SDK arguments carry
   * credentials, wallet identifiers and encryption keys. Opt in here, per deployment.
   *
   * @default undefined
   */
  requestHook?: IdosInstrumentationRequestHook;

  /**
   * Hook for adding custom attributes from the resolved return value.
   *
   * Same caveat as {@link requestHook}: return values carry credential contents.
   *
   * @default undefined
   */
  responseHook?: IdosInstrumentationResponseHook;

  /**
   * If true, spans are only created when there is already an active span.
   *
   * Useful in the browser, where an idOS call outside a user-interaction span
   * would otherwise produce a single-span orphan trace.
   *
   * @default false
   */
  requireParentSpan?: boolean;
}
