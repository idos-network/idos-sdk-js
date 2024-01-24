/*
  This should be in a remote server, since it has secrets.
  However, for the sake of simplicity, we're just using local async calls.

  WARNING
  The code in this file is still very raw. The intent is to package it neatly into a server-side SDK.
*/

import { idOS } from "@idos-network/idos-sdk";
import { WebKwil } from "@kwilteam/kwil-js";
import type { SignerSupplier } from "@kwilteam/kwil-js/dist/core/builders.d";
import * as Base64Codec from "@stablelib/base64";
import * as Utf8Codec from "@stablelib/utf8";
import { ethers } from "ethers";
import nacl from "tweetnacl";

const ENCRYPTION_SECRET_KEY = Base64Codec.decode("2bu7SyMToRAuFn01/oqU3fx9ZHo9GKugQhQYmDuBXzg=");
const EVM_GRANTEE_PRIVATE_KEY =
  "0x515c2fed89c22eaa9d41cfce6e6e454fa0a39353e711d6a99f34b4ecab4b4859";

const ENCRYPTION_KEY_PAIR = nacl.box.keyPair.fromSecretKey(ENCRYPTION_SECRET_KEY);

const EVM_NODE_URL = "https://ethereum-sepolia.publicnode.com";
const grantee = new ethers.Wallet(
  EVM_GRANTEE_PRIVATE_KEY,
  new ethers.JsonRpcProvider(EVM_NODE_URL)
);

const decrypt = async (b64FullMessage: string, b64SenderPublicKey: string): Promise<string> => {
  const fullMessage = Base64Codec.decode(b64FullMessage);
  const senderPublicKey = Base64Codec.decode(b64SenderPublicKey);

  const nonce = fullMessage.slice(0, nacl.box.nonceLength);
  const message = fullMessage.slice(nacl.box.nonceLength, fullMessage.length);

  const decrypted = nacl.box.open(message, nonce, senderPublicKey, ENCRYPTION_KEY_PAIR.secretKey);

  if (decrypted == null) {
    throw Error(
      `Couldn't decrypt. ${JSON.stringify(
        {
          fullMessage: Base64Codec.encode(fullMessage),
          message: Base64Codec.encode(message),
          nonce: Base64Codec.encode(nonce),
          senderPublicKey: Base64Codec.encode(senderPublicKey),
          serverPublicKey: Base64Codec.encode(ENCRYPTION_KEY_PAIR.publicKey)
        },
        null,
        2
      )}`
    );
  }

  return Utf8Codec.decode(decrypted);
};

interface Grant {
  content: string;
  encryption_public_key: string;
}

const fetchAccessGrantDataFromIdos = async (dataId: string): Promise<Grant> => {
  const kwilClient = new WebKwil({
    kwilProvider: idOS.kwil.kwilProvider,
    chainId: idOS.kwil.chainId
  });

  const res = await kwilClient.call(
    {
      dbid: idOS.kwil.dbId,
      action: "get_credential_shared",
      inputs: [{ $id: dataId }]
    },
    {
      signer: grantee as unknown as SignerSupplier,
      publicKey: grantee.signingKey.publicKey,
      signatureType: "secp256k1_ep"
    }
  );

  if (!res.data || !res.data.result) throw new Error(res.toString());

  if (!res.data.result[0])
    throw new Error(
      `Programming error: access grant for credential ${dataId} exists in the smart contract, but the credential does not exist in idOS.`
    );

  return res.data.result[0] as unknown as Grant;
};

export const getAccessGrantsContentDecrypted = async (dataId: string) => {
  const credentialCopy = await fetchAccessGrantDataFromIdos(dataId);
  const decrypted_content = await decrypt(
    credentialCopy.content,
    credentialCopy.encryption_public_key
  );
  return decrypted_content;
};

export const publicInfo = {
  granteeAddress: grantee.address,
  encryptionPublicKey: Base64Codec.encode(ENCRYPTION_KEY_PAIR.publicKey),
  lockTimeSpanSeconds: 3600 // one hour
};
