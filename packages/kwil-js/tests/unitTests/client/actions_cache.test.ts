import { NodeKwil } from "../../../src";

class TestKwil extends NodeKwil {
  constructor() {
    super({ kwilProvider: "doesnt matter", chainId: "doesnt matter" });
  }
}

describe("Kwil actions caching", () => {
  let kwil: TestKwil;
  let mockSelectQuery: jest.Mock;

  beforeEach(() => {
    mockSelectQuery = jest.fn().mockResolvedValue({
      data: [
        { name: "createUser", parameters: ["username", "email"] },
        { name: "getUser", parameters: ["id"] },
      ],
    });

    kwil = new TestKwil();
    kwil.selectQuery = mockSelectQuery;
  });

  it("should cache getActions results", async () => {
    const namespace = "myappusers";

    // First call - should hit database
    const result1 = await kwil.getActions(namespace);
    expect(mockSelectQuery).toHaveBeenCalledTimes(1);
    expect(result1.data).toHaveLength(2);

    // Second call - should use cache
    const result2 = await kwil.getActions(namespace);
    expect(mockSelectQuery).toHaveBeenCalledTimes(1); // Still 1
    expect(result2.data).toEqual(result1.data);
  });

  it("should handle different namespaces independently", async () => {
    await kwil.getActions("appusers");
    await kwil.getActions("appposts");

    expect(mockSelectQuery).toHaveBeenCalledTimes(2);
    expect(mockSelectQuery).toHaveBeenCalledWith(expect.any(String), { $namespace: "appusers" });
    expect(mockSelectQuery).toHaveBeenCalledWith(expect.any(String), { $namespace: "appposts" });
  });

  it("should handle errors without caching", async () => {
    mockSelectQuery.mockRejectedValueOnce(new Error("DB error"));

    await expect(kwil.getActions("appfailing")).rejects.toThrow("DB error");

    // Should retry on next call (not cached)
    mockSelectQuery.mockResolvedValueOnce({ data: [] });
    await expect(kwil.getActions("appfailing")).resolves.toBeTruthy();
    expect(mockSelectQuery).toHaveBeenCalledTimes(2);
  });
});
