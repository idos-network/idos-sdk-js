import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

import { AccessModifier } from "../core/enums";
import { NodeKwil } from "../index";
import { Action } from "./action";

class TestKwil extends NodeKwil {
  constructor() {
    super({ kwilProvider: "does not matter", chainId: "does not matter" });
  }
}

function actionRow(name: string) {
  return {
    name,
    namespace: "main",
    parameter_names: ["$name"],
    parameter_types: ["text"],
    return_names: [],
    return_types: [],
    returns_table: false,
    access_modifiers: [AccessModifier.PUBLIC],
    built_in: false,
    raw_statement: "",
  };
}

describe("action lookup cache", () => {
  let kwil: TestKwil;
  let mockSelectQuery: Mock;

  beforeEach(() => {
    mockSelectQuery = vi.fn();
    kwil = new TestKwil();
    kwil.selectQuery = mockSelectQuery;
  });

  function build(name = "add_user") {
    return Action.createTx(kwil, {
      actionName: name,
      namespace: "main",
      chainId: "does not matter",
      description: "",
      actionInputs: [{ $name: "ada" }],
    }).buildTx(false);
  }

  it("fetches again when the cached list omits the action", async () => {
    mockSelectQuery
      .mockResolvedValueOnce({ status: 200, data: [actionRow("other")] })
      .mockResolvedValueOnce({ status: 200, data: [actionRow("add_user")] });

    await expect(build()).rejects.toThrow("signer is required to build a transaction.");
    expect(mockSelectQuery).toHaveBeenCalledTimes(2);
  });

  it("drops the namespace cache when the action is still missing", async () => {
    mockSelectQuery.mockResolvedValue({ status: 200, data: [actionRow("other")] });

    await expect(build()).rejects.toThrow("Action 'add_user' not found in namespace 'main'.");
    expect(mockSelectQuery).toHaveBeenCalledTimes(2);

    await kwil.getActions("main");
    expect(mockSelectQuery).toHaveBeenCalledTimes(3);
  });

  it("keeps the empty-namespace error after one refetch", async () => {
    mockSelectQuery.mockResolvedValue({ status: 200, data: [] });

    await expect(build()).rejects.toThrow("No actions found for the namespace 'main'.");
    expect(mockSelectQuery).toHaveBeenCalledTimes(2);
  });

  it("does not refetch an unsuccessful action lookup", async () => {
    mockSelectQuery.mockResolvedValue({ status: 500, data: [actionRow("add_user")] });

    await expect(build()).rejects.toThrow(
      "Failed to retrieve actions for namespace main. Status: 500",
    );
    expect(mockSelectQuery).toHaveBeenCalledTimes(1);
  });
});
