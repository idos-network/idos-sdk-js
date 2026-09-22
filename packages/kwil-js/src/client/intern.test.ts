import { describe, expect, it, vi } from "vitest";

import { wrap, unwrap } from "../client/intern";
import { Kwil } from "../client/kwil";
import { EnvironmentType } from "../core/enums";
import { GenericResponse } from "../core/resreq";
import { Transaction } from "../core/tx";

class TestKwil extends Kwil<EnvironmentType> {
  constructor() {
    super({ kwilProvider: "does not matter", chainId: "does not matter" });
  }
}

describe("client/intern", () => {
  const mockEstimateMethod = vi.fn(async (_tx: Transaction): Promise<GenericResponse<string>> => {
    return { status: 200, data: "100" };
  });

  it("wrap should wrap Kwil client", () => {
    const kwil = new TestKwil();
    const wrapped = wrap(kwil, mockEstimateMethod);
    expect(wrapped).toBe(undefined);
  });

  it("unwrap should unwrap Kwil client method", () => {
    const kwil = new TestKwil();
    wrap(kwil, mockEstimateMethod);
    const unwrapped = unwrap(kwil);
    expect(typeof unwrapped).toBe("function");
    expect(unwrapped).toBe(mockEstimateMethod);
  });
});
