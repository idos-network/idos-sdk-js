import { idOSConsumer as idOSConsumerClass } from "@idos-network/consumer";

export async function idOSConsumer() {
  const NODE_URL = "https://2979-2a02-8109-b710-5400-3429-d79e-395f-cda3.ngrok-free.app/";
  const OTHER_CONSUMER_ENCRYPTION_SECRET_KEY = "j7IppyTqzOfKQ7PuF/lx7HpoDZBbiO2Jrdx1gYN/+8M=";
  const OTHER_CONSUMER_SIGNING_SECRET_KEY = "...";

  const xrpKeypair = await import("ripple-keypairs");

  const consumer = await idOSConsumerClass.init({
    nodeUrl: NODE_URL,
    //consumerSigner: nacl.sign.keyPair.fromSecretKey(hexDecode(OTHER_CONSUMER_SIGNING_SECRET_KEY)),
    //consumerSigner: new ethers.Wallet("0x83be6359292cf5f86d4dc61101bb3f576df20712cdd803dbbae6db46a4a2c3e6"),
    //consumerSigner: NearKeyPair.fromString("ed25519:5u1jT1KdKZ9czxm3jzEPTjv42xAEjCXBDMNDeVsHapufs9wqmUU4dATAtuqaxrYLCTDkxwNYsxJVXFLR3sCQMaMX"),
    consumerSigner: (() => {
      const xrpKeyPair = xrpKeypair.deriveKeypair("sEd7RfxiQmvafzQjkxWfhw5g9WWUckh", {
        algorithm: "ed25519",
      });

      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      const sign = (m) => xrpKeypair.sign(m, xrpKeyPair.privateKey) as any;
      const verify = (m, s) => xrpKeypair.verify(m, s, xrpKeyPair.publicKey);

      return {
        isXrpSigner: true,
        sign,
        verify,
        publicKey: xrpKeyPair.publicKey,
        privateKey: xrpKeyPair.privateKey,
      };
    })(),
    recipientEncryptionPrivateKey: OTHER_CONSUMER_ENCRYPTION_SECRET_KEY,
  });

  return consumer;
}

async function main() {
  try {
    console.log("Initializing consumer...");
    const consumer = await idOSConsumer();
    console.log("Consumer created successfully");

    console.log("Getting grants count...");
    const count = await consumer.getGrantsCount();
    console.log("Grants count:", count);
  } catch (error) {
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    throw error; // Re-throw to see full error in console
  }
}

main().catch(console.error);
