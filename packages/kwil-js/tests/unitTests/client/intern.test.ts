import { wrap, unwrap } from "../../../src/client/intern";
import { Kwil } from "../../../src/client/kwil";
import { EnvironmentType } from "../../../src/core/enums";
import { GenericResponse } from "../../../src/core/resreq";
import { Transaction } from "../../../src/core/tx";

class TestKwil extends Kwil<EnvironmentType> {
  constructor() {
    super({ kwilProvider: "doesnt matter", chainId: "doesnt matter" });
  }
}

describe("client/intern", () => {
  const mockEstimateMethod = jest.fn(async (tx: Transaction): Promise<GenericResponse<string>> => {
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
