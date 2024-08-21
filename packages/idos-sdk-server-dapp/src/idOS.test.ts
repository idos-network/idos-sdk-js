import { describe, expect, it } from "vitest";
import { idOS } from "./idOS";

const ENCRYPTION_SECRET_KEY = "2bu7SyMToRAuFn01/oqU3fx9ZHo9GKugQhQYmDuBXzg=";
const EVM_GRANTEE_PRIVATE_KEY =
  "0x515c2fed89c22eaa9d41cfce6e6e454fa0a39353e711d6a99f34b4ecab4b4859";
const EVM_NODE_URL = "https://ethereum-sepolia.publicnode.com";

describe("idOS Server dApp SDK", () => {
  it("should initialise properly", async () => {
    const instance = await idOS.init(
      "EVM",
      EVM_GRANTEE_PRIVATE_KEY,
      ENCRYPTION_SECRET_KEY,
      EVM_NODE_URL,
    );

    expect(instance).toBeDefined();
  });
});
