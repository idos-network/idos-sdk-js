import { idOSConsumer as idOSConsumerClass } from "@idos-network/consumer";
import { hexDecode } from "@idos-network/core";
import * as ethers from "ethers";
import { KeyPair as NearKeyPair } from "near-api-js";
import * as xrpKeypair from "ripple-keypairs";
import invariant from "tiny-invariant";
import nacl from "tweetnacl";

export async function idOSConsumer() {
  const NODE_URL = "http://localhost:8090";
  const OTHER_CONSUMER_ENCRYPTION_SECRET_KEY = "...";
  const OTHER_CONSUMER_SIGNING_SECRET_KEY = "...";

  const consumer = await idOSConsumerClass.init({
    nodeUrl: NODE_URL,
    //consumerSigner: nacl.sign.keyPair.fromSecretKey(hexDecode(OTHER_CONSUMER_SIGNING_SECRET_KEY)),
    //consumerSigner: new ethers.Wallet("0x83be6359292cf5f86d4dc61101bb3f576df20712cdd803dbbae6db46a4a2c3e6"),
    //consumerSigner: NearKeyPair.fromString("ed25519:5u1jT1KdKZ9czxm3jzEPTjv42xAEjCXBDMNDeVsHapufs9wqmUU4dATAtuqaxrYLCTDkxwNYsxJVXFLR3sCQMaMX"),
    consumerSigner: (() => {
      const xrpKeyPair = xrpKeypair.deriveKeypair("...", { algorithm: "ed25519" });
      const sign = (m) => xrpKeypair.sign(m, xrpKeyPair.privateKey);
      const verify = (m, s) => xrpKeypair.verify(m, s, xrpKeyPair.publicKey);

      return { isXrpSigner: true, sign, verify, publicKey: xrpKeyPair.publicKey };
    })(),
    recipientEncryptionPrivateKey: OTHER_CONSUMER_ENCRYPTION_SECRET_KEY,
  });

  return consumer;
}

const consumer = await idOSConsumer();
