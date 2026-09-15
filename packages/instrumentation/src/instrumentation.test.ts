import type { ReadableSpan } from "@opentelemetry/sdk-trace-base";

import { context, SpanKind, SpanStatusCode } from "@opentelemetry/api";
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import {
  ATTR_DB_NAMESPACE,
  ATTR_DB_OPERATION_NAME,
  ATTR_DB_SYSTEM_NAME,
  ATTR_ERROR_TYPE,
} from "@opentelemetry/semantic-conventions";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { IdosInstrumentation } from "./instrumentation";
import { ATTR_IDOS_KWIL_TX_HASH, ATTR_IDOS_SDK_CLASS, ATTR_IDOS_SDK_METHOD } from "./semconv";

type KwilCallParams = { name: string; inputs?: Record<string, unknown> };

/**
 * Stand-ins with the shape `TARGETS` expects. Built fresh per test so that a
 * patched prototype never leaks into the next one.
 */
const buildNamespaces = () => {
  class KwilActionClient {
    async call(params: KwilCallParams): Promise<string> {
      return `called:${params.name}`;
    }

    async execute(params: KwilCallParams): Promise<string> {
      if (params.name === "boom") throw new Error("kwil exploded");
      const txHash = "0xdeadbeef";
      await this.waitForTx(txHash);
      return txHash;
    }

    async waitForTx(txHash: string): Promise<void> {
      if (txHash === "0xtimeout") {
        const error = new Error("timed out waiting for tx");
        error.name = "KwilTxPollTimeoutError";
        throw error;
      }
    }
  }

  const kwil = new KwilActionClient();

  class idOSIssuer {
    async getUser(id: string): Promise<{ id: string }> {
      await kwil.call({ name: "get_user", inputs: { id } });
      return { id };
    }
  }

  return {
    kwil,
    kwilInfra: { KwilActionClient },
    issuer: { idOSIssuer },
  };
};

describe("IdosInstrumentation", () => {
  let exporter: InMemorySpanExporter;
  let instrumentation: IdosInstrumentation;
  let namespaces: ReturnType<typeof buildNamespaces>;

  beforeEach(() => {
    // Without a context manager `context.with` cannot propagate, so nothing nests.
    context.setGlobalContextManager(new AsyncLocalStorageContextManager().enable());
    exporter = new InMemorySpanExporter();
    instrumentation = new IdosInstrumentation();
    instrumentation.setTracerProvider(
      new BasicTracerProvider({ spanProcessors: [new SimpleSpanProcessor(exporter)] }),
    );
    namespaces = buildNamespaces();
  });

  afterEach(() => {
    context.disable();
  });

  const finished = (): ReadableSpan[] => exporter.getFinishedSpans();

  it("traces kwil calls with db semantic conventions and keeps inputs off the span", async () => {
    instrumentation.patchModuleExports("@idos-network/kwil-infra", namespaces.kwilInfra);

    await namespaces.kwil.call({ name: "get_user", inputs: { id: "secret-user-id" } });

    expect(finished()).toHaveLength(1);
    const [span] = finished();
    expect(span.name).toBe("idos.kwil.call get_user");
    expect(span.kind).toBe(SpanKind.CLIENT);
    expect(span.attributes[ATTR_DB_SYSTEM_NAME]).toBe("kwil");
    expect(span.attributes[ATTR_DB_NAMESPACE]).toBe("main");
    expect(span.attributes[ATTR_DB_OPERATION_NAME]).toBe("get_user");
    expect(JSON.stringify(span.attributes)).not.toContain("secret-user-id");
  });

  it("records the tx hash of an execute", async () => {
    instrumentation.patchModuleExports("@idos-network/kwil-infra", namespaces.kwilInfra);

    await namespaces.kwil.execute({ name: "add_wallet" });

    expect(finished()[0].attributes[ATTR_IDOS_KWIL_TX_HASH]).toBe("0xdeadbeef");
  });

  it("traces the tx wait as a child of the execute that broadcast it", async () => {
    instrumentation.patchModuleExports("@idos-network/kwil-infra", namespaces.kwilInfra);

    await namespaces.kwil.execute({ name: "add_wallet" });

    const [wait, execute] = finished();
    expect(wait.name).toBe("idos.kwil.waitForTx");
    expect(wait.kind).toBe(SpanKind.CLIENT);
    expect(wait.attributes[ATTR_IDOS_KWIL_TX_HASH]).toBe("0xdeadbeef");
    expect(execute.name).toBe("idos.kwil.execute add_wallet");
    expect(wait.parentSpanContext?.spanId).toBe(execute.spanContext().spanId);
  });

  it("distinguishes a tx poll timeout from other failures via error.type", async () => {
    instrumentation.patchModuleExports("@idos-network/kwil-infra", namespaces.kwilInfra);

    await expect(namespaces.kwil.waitForTx("0xtimeout")).rejects.toThrow(
      "timed out waiting for tx",
    );

    const [span] = finished();
    expect(span.status.code).toBe(SpanStatusCode.ERROR);
    expect(span.attributes[ATTR_ERROR_TYPE]).toBe("KwilTxPollTimeoutError");
  });

  it("marks the span failed and rethrows when the method rejects", async () => {
    instrumentation.patchModuleExports("@idos-network/kwil-infra", namespaces.kwilInfra);

    await expect(namespaces.kwil.execute({ name: "boom" })).rejects.toThrow("kwil exploded");

    const [span] = finished();
    expect(span.status.code).toBe(SpanStatusCode.ERROR);
    expect(span.status.message).toBe("kwil exploded");
    expect(span.events.map((event) => event.name)).toContain("exception");
  });

  it("nests kwil spans under the SDK method that issued them", async () => {
    instrumentation.patchModuleExports("@idos-network/kwil-infra", namespaces.kwilInfra);
    instrumentation.patchModuleExports("@idos-network/issuer", namespaces.issuer);

    await new namespaces.issuer.idOSIssuer().getUser("u1");

    const [child, parent] = finished();
    expect(parent.name).toBe("idOSIssuer.getUser");
    expect(parent.attributes[ATTR_IDOS_SDK_CLASS]).toBe("idOSIssuer");
    expect(parent.attributes[ATTR_IDOS_SDK_METHOD]).toBe("getUser");
    expect(child.name).toBe("idos.kwil.call get_user");
    expect(child.parentSpanContext?.spanId).toBe(parent.spanContext().spanId);
  });

  it("skips instrumentation when requireParentSpan is set and there is no parent", async () => {
    instrumentation.setConfig({ requireParentSpan: true });
    instrumentation.patchModuleExports("@idos-network/kwil-infra", namespaces.kwilInfra);

    await namespaces.kwil.call({ name: "get_user" });

    expect(finished()).toHaveLength(0);
  });

  it("runs the request and response hooks so callers can opt into their own attributes", async () => {
    instrumentation.setConfig({
      requestHook: (span, info) => span.setAttribute("test.args", JSON.stringify(info.args)),
      responseHook: (span, info) => span.setAttribute("test.result", String(info.result)),
    });
    instrumentation.patchModuleExports("@idos-network/kwil-infra", namespaces.kwilInfra);

    await namespaces.kwil.call({ name: "get_user", inputs: { id: "u1" } });

    const [span] = finished();
    expect(span.attributes["test.args"]).toContain("u1");
    expect(span.attributes["test.result"]).toBe("called:get_user");
  });

  it("restores the original methods on unpatch", async () => {
    instrumentation.patchModuleExports("@idos-network/kwil-infra", namespaces.kwilInfra);
    instrumentation.unpatchModuleExports("@idos-network/kwil-infra", namespaces.kwilInfra);

    await namespaces.kwil.call({ name: "get_user" });

    expect(finished()).toHaveLength(0);
  });
});
