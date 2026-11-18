import type { KeyPair } from "near-api-js";

import {
  binaryWriteUint16BE,
  borshDeserialize,
  borshSerialize,
  bytesConcat,
  sha256Hash,
  utf8Decode,
} from "@idos-network/utils/codecs";

// 2**31 + 413. Prepended so a NEP-413 payload cannot be a valid NEAR transaction.
const NEP413_TAG = 2147484061;

const nep413PayloadSchema = {
  struct: {
    message: "string",
    nonce: { array: { type: "u8", len: 32 } },
    recipient: "string",
    callbackUrl: { option: "string" },
  },
} as const;

// Borsh has no struct header, so this is the same bytes as `u32 tag` followed by `nep413PayloadSchema`.
const kwilNep413Schema = {
  struct: {
    tag: "u32",
    ...nep413PayloadSchema.struct,
  },
} as const;

type Nep413Fields = {
  message: string;
  nonce: Uint8Array | number[];
  recipient: string;
  callbackUrl?: string;
};

export type Nep413Envelope = Nep413Fields & { tag: number };

export function nep413SignHash(payload: Nep413Fields): Uint8Array {
  return sha256Hash(
    bytesConcat(borshSerialize("u32", NEP413_TAG), borshSerialize(nep413PayloadSchema, payload)),
  );
}

export function serializeKwilNep413(payload: Nep413Fields): Uint8Array {
  return borshSerialize(kwilNep413Schema, { tag: NEP413_TAG, ...payload });
}

export function deserializeKwilNep413(bytes: Uint8Array): Nep413Envelope {
  return borshDeserialize(kwilNep413Schema, bytes) as Nep413Envelope;
}

export function kwilNep413Signer(
  recipient: string,
): (keyPair: KeyPair) => (messageBytes: Uint8Array) => Promise<Uint8Array> {
  return (keyPair: KeyPair) =>
    async (messageBytes: Uint8Array): Promise<Uint8Array> => {
      const message = utf8Decode(messageBytes);
      const nonce = crypto.getRandomValues(new Uint8Array(32));
      const { signature } = keyPair.sign(nep413SignHash({ message, nonce, recipient }));

      const kwilNep413BorshPayload = serializeKwilNep413({ message, nonce, recipient });

      return bytesConcat(
        binaryWriteUint16BE(kwilNep413BorshPayload.length),
        kwilNep413BorshPayload,
        signature,
      );
    };
}
