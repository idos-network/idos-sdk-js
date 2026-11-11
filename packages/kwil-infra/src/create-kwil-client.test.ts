import type { NodeKwil } from "@idos-network/kwil-js";

import { describe, expect, it, vi } from "vitest";

import { KwilActionClient, KwilCallError } from "./create-kwil-client";

function clientAnswering(data: { result?: unknown[]; error?: string }) {
  const call = vi.fn(async () => ({ status: 200, data }));
  return new KwilActionClient({ call } as unknown as NodeKwil);
}

const params = { name: "get_user_as_mm_operator", inputs: { storage_token: "t" } } as const;

describe("KwilActionClient.call", () => {
  it("resolves to an empty result for a failed view by default", async () => {
    const client = clientAnswering({ result: [], error: "storage token: expired" });

    await expect(client.call(params)).resolves.toEqual([]);
  });

  it("throws KwilCallError with the action error when throwOnCallError is set", async () => {
    const client = clientAnswering({ result: [], error: "storage token: expired" });
    client.throwOnCallError = true;

    const error = await client.call(params).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(KwilCallError);
    expect(error).toMatchObject({
      actionName: "get_user_as_mm_operator",
      message: "storage token: expired",
    });
  });

  it("returns the rows of a successful view when throwOnCallError is set", async () => {
    const client = clientAnswering({ result: [{ id: "1" }] });
    client.throwOnCallError = true;

    await expect(client.call(params)).resolves.toEqual([{ id: "1" }]);
  });
});
