import { describe, expect, it } from "vitest";
import { idOS } from "./idOS";

const ENCRYPTION_SECRET_KEY = "2bu7SyMToRAuFn01/oqU3fx9ZHo9GKugQhQYmDuBXzg=";
const EVM_GRANTEE_PRIVATE_KEY =
  "0x515c2fed89c22eaa9d41cfce6e6e454fa0a39353e711d6a99f34b4ecab4b4859";
const EVM_NODE_URL = "https://nodes.idos.network";
const DB_ID = "x2eb42160d1f2414213163901610123089b41d49be7c3d7d7012205e2";

describe("idOS Server dApp SDK", () => {
  it("should initialise properly", async () => {
    const instance = await idOS.init(
      "EVM",
      EVM_GRANTEE_PRIVATE_KEY,
      ENCRYPTION_SECRET_KEY,
      EVM_NODE_URL,
      DB_ID,
    );

    expect(instance).toBeDefined();
  });
});
