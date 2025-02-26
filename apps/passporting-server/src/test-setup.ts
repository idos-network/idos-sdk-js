import nacl from "tweetnacl";
import { vi } from "vitest";

// Generate a deterministic test keypair
const TEST_KEYPAIR = nacl.sign.keyPair();
const TEST_SECRET_KEY = Buffer.from(TEST_KEYPAIR.secretKey).toString("base64");
const TEST_PUBLIC_KEY = Buffer.from(TEST_KEYPAIR.publicKey).toString("base64");

// Mock environment variables
vi.mock("hono/adapter", () => ({
  env: () => ({
    KWIL_NODE_URL: "http://test-node.url",
    ISSUER_SIGNING_SECRET_KEY: TEST_SECRET_KEY,
    ISSUER_ENCRYPTION_SECRET_KEY: TEST_SECRET_KEY,
    CLIENT_SECRETS: "test-secret-1,test-secret-2",
  }),
}));
