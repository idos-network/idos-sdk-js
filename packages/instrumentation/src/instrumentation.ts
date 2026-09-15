import type { Attributes, Span } from "@opentelemetry/api";

import { context, SpanKind, SpanStatusCode, trace } from "@opentelemetry/api";
import {
  InstrumentationBase,
  InstrumentationNodeModuleDefinition,
  isWrapped,
} from "@opentelemetry/instrumentation";
import { ATTR_ERROR_TYPE } from "@opentelemetry/semantic-conventions";

import type { MethodTarget, ModuleTarget } from "./targets";
import type { IdosInstrumentationConfig } from "./types";

import { ATTR_IDOS_SDK_CLASS, ATTR_IDOS_SDK_METHOD, ATTR_IDOS_SDK_PACKAGE } from "./semconv";
import { TARGETS } from "./targets";
import { PACKAGE_NAME, PACKAGE_VERSION } from "./version";

type AnyMethod = (...args: unknown[]) => unknown;

const isThenable = (value: unknown): value is PromiseLike<unknown> =>
  typeof (value as PromiseLike<unknown> | null)?.then === "function";

/**
 * Traces the idOS SDK: every public method of `@idos-network/client`,
 * `/consumer`, `/issuer`, the enclave providers, `verifyCredential`, and the
 * kwil `call`/`execute` round-trips they all bottom out in.
 */
export class IdosInstrumentation extends InstrumentationBase<IdosInstrumentationConfig> {
  constructor(config: IdosInstrumentationConfig = {}) {
    super(PACKAGE_NAME, PACKAGE_VERSION, config);
  }

  protected init(): InstrumentationNodeModuleDefinition[] {
    return TARGETS.map(
      (target) =>
        new InstrumentationNodeModuleDefinition(
          target.name,
          target.supportedVersions,
          (moduleExports: unknown) => this.applyPatch(target.name, target, moduleExports),
          (moduleExports: unknown) => this.removePatch(target.name, target, moduleExports),
        ),
    );
  }

  /**
   * Patch a module namespace you already imported.
   *
   * The automatic hooking in {@link InstrumentationBase} needs Node's module
   * loader hook (`import-in-the-middle`), which has to be installed with
   * `module.register()` before the import — and does not exist at all in a
   * browser or a bundled app. This is the alternative everywhere: import the
   * idOS module and hand its namespace over. Exports the module does not have
   * are skipped.
   */
  patchModuleExports(moduleName: string, moduleExports: unknown): void {
    const target = this.findTarget(moduleName);
    if (target) this.applyPatch(moduleName, target, moduleExports);
  }

  /** Reverse of {@link patchModuleExports}. */
  unpatchModuleExports(moduleName: string, moduleExports: unknown): void {
    const target = this.findTarget(moduleName);
    if (target) this.removePatch(moduleName, target, moduleExports);
  }

  private findTarget(moduleName: string): ModuleTarget | undefined {
    const target = TARGETS.find((t) => t.name === moduleName);
    if (!target) this._diag.warn(`No instrumentation targets known for "${moduleName}"`);
    return target;
  }

  private applyPatch(moduleName: string, target: ModuleTarget, moduleExports: unknown): unknown {
    this.eachMember(moduleName, target, moduleExports, (owner, name, method, className) => {
      if (isWrapped(owner[name])) this._unwrap(owner, name);
      this._wrap(owner, name, (original) =>
        this.traced(original as AnyMethod, moduleName, className, method),
      );
    });
    return moduleExports;
  }

  private removePatch(moduleName: string, target: ModuleTarget, moduleExports: unknown): unknown {
    this.eachMember(moduleName, target, moduleExports, (owner, name) => {
      if (isWrapped(owner[name])) this._unwrap(owner, name);
    });
    return moduleExports;
  }

  /** Resolves every target method to the object that owns it, skipping what is absent. */
  private eachMember(
    moduleName: string,
    target: ModuleTarget,
    moduleExports: unknown,
    visit: (
      owner: Record<string, unknown>,
      name: string,
      method: MethodTarget,
      className: string | undefined,
    ) => void,
  ): void {
    if (typeof moduleExports !== "object" || moduleExports === null) return;
    const namespace = moduleExports as Record<string, unknown>;

    const visitOne = (
      owner: Record<string, unknown>,
      member: string | MethodTarget,
      className: string | undefined,
    ): void => {
      const method: MethodTarget = typeof member === "string" ? { name: member } : member;
      const label = `${className ? `${className}.` : ""}${method.name}`;
      if (typeof owner[method.name] !== "function") {
        this._diag.debug(`${moduleName}: ${label} is not a function, skipping`);
        return;
      }
      try {
        visit(owner, method.name, method, className);
      } catch (error) {
        // An ESM namespace object is read-only unless an import hook made it writable.
        this._diag.warn(`${moduleName}: could not patch ${label}: ${String(error)}`);
      }
    };

    for (const klass of target.classes) {
      const ctor = namespace[klass.className];
      if (typeof ctor !== "function") {
        this._diag.debug(`${moduleName}: class ${klass.className} not exported, skipping`);
        continue;
      }
      const prototype = (ctor as { prototype?: unknown }).prototype;
      if (typeof prototype === "object" && prototype !== null) {
        for (const member of klass.methods) {
          visitOne(prototype as Record<string, unknown>, member, klass.className);
        }
      }
      for (const member of klass.staticMethods ?? []) {
        visitOne(ctor as unknown as Record<string, unknown>, member, klass.className);
      }
    }
  }

  private traced(
    original: AnyMethod,
    moduleName: string,
    className: string | undefined,
    target: MethodTarget,
  ): AnyMethod {
    // The patch must stay a `function` so the wrapped method keeps its call-site
    // receiver, which leaves `this` taken — same as instrumentation-pg does.
    // oxlint-disable-next-line typescript/no-this-alias -- see above
    const instrumentation = this;
    const defaultSpanName = `${className ? `${className}.` : ""}${target.name}`;

    return function patched(this: unknown, ...args: unknown[]): unknown {
      const config = instrumentation.getConfig();
      if (config.requireParentSpan && trace.getSpan(context.active()) === undefined) {
        return original.apply(this, args);
      }

      const attributes: Attributes = {
        [ATTR_IDOS_SDK_PACKAGE]: moduleName,
        [ATTR_IDOS_SDK_METHOD]: target.name,
        ...(className ? { [ATTR_IDOS_SDK_CLASS]: className } : {}),
        ...target.attributes?.(args),
      };

      const span = instrumentation.tracer.startSpan(target.spanName?.(args) ?? defaultSpanName, {
        kind: target.kind ?? SpanKind.INTERNAL,
        attributes,
      });

      instrumentation._runSpanCustomizationHook(config.requestHook, "requestHook", span, {
        moduleName,
        className,
        methodName: target.name,
        args,
      });

      return context.with(trace.setSpan(context.active(), span), () => {
        let result: unknown;
        try {
          result = original.apply(this, args);
        } catch (error) {
          instrumentation.failSpan(span, error);
          throw error;
        }

        if (!isThenable(result)) {
          instrumentation.endSpan(span, moduleName, className, target, result);
          return result;
        }

        return result.then(
          (value: unknown) => {
            instrumentation.endSpan(span, moduleName, className, target, value);
            return value;
          },
          (error: unknown) => {
            instrumentation.failSpan(span, error);
            throw error;
          },
        );
      });
    };
  }

  private endSpan(
    span: Span,
    moduleName: string,
    className: string | undefined,
    target: MethodTarget,
    result: unknown,
  ): void {
    const attributes = target.responseAttributes?.(result);
    if (attributes) span.setAttributes(attributes);

    this._runSpanCustomizationHook(this.getConfig().responseHook, "responseHook", span, {
      moduleName,
      className,
      methodName: target.name,
      result,
    });
    span.end();
  }

  private failSpan(span: Span, error: unknown): void {
    if (error instanceof Error) {
      span.recordException(error);
      span.setAttribute(ATTR_ERROR_TYPE, error.name);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    } else {
      span.setAttribute(ATTR_ERROR_TYPE, typeof error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: String(error) });
    }
    span.end();
  }
}
