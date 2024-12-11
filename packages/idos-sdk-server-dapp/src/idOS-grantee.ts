import { KwilSigner, NodeKwil } from "@kwilteam/kwil-js";
import * as Base64Codec from "@stablelib/base64";
import * as Utf8Codec from "@stablelib/utf8";
import type { ethers } from "ethers";
import type { KeyPair } from "near-api-js";
import nacl from "tweetnacl";
import { implicitAddressFromPublicKey, kwilNep413Signer } from "../../kwil-nep413-signer/src";

import {
  EvmGrants,
  type EvmGrantsOptions,
  type NearGrantsOptions,
} from "../../idos-sdk-js/src/lib/grants";
import type { GrantChild } from "../../idos-sdk-js/src/lib/grants/grant-child.ts";
import type Grant from "../../idos-sdk-js/src/lib/grants/grant.ts";
import { KwilWrapper } from "../../idos-sdk-js/src/lib/kwil-wrapper.ts";
import { assertNever } from "../../idos-sdk-js/src/lib/utils.ts";

export class NoncedBox {
  keyPair: nacl.BoxKeyPair;

  constructor(keyPair: nacl.BoxKeyPair) {
    this.keyPair = keyPair;
  }

  static fromBase64SecretKey(secret: string): NoncedBox {
    return new NoncedBox(nacl.box.keyPair.fromSecretKey(Base64Codec.decode(secret)));
  }

  async decrypt(b64FullMessage: string, b64SenderPublicKey: string): Promise<string> {
    const fullMessage = Base64Codec.decode(b64FullMessage);
    const senderPublicKey = Base64Codec.decode(b64SenderPublicKey);

    const nonce = fullMessage.slice(0, nacl.box.nonceLength);
    const message = fullMessage.slice(nacl.box.nonceLength, fullMessage.length);

    const decrypted = nacl.box.open(message, nonce, senderPublicKey, this.keyPair.secretKey);

    if (decrypted == null) {
      throw Error(
        `Couldn't decrypt. ${JSON.stringify(
          {
            fullMessage: Base64Codec.encode(fullMessage),
            message: Base64Codec.encode(message),
            nonce: Base64Codec.encode(nonce),
            senderPublicKey: Base64Codec.encode(senderPublicKey),
            receiverPublicKey: Base64Codec.encode(this.keyPair.publicKey),
          },
          null,
          2,
        )}`,
      );
    }

    return Utf8Codec.decode(decrypted);
  }
}

type ChainType = "EVM" | "NEAR";

const buildKwilSignerAndGrantee = (
  chainType: ChainType,
  granteeSigner: KeyPair | ethers.Wallet,
): [KwilSigner, string] => {
  switch (chainType) {
    case "EVM": {
      const signer = granteeSigner as ethers.Wallet;
      // biome-ignore lint/suspicious/noExplicitAny: TBD.
      return [new KwilSigner(signer as any, signer.address), signer.address];
    }
    case "NEAR": {
      const signer = granteeSigner as KeyPair;
      const publicKey = signer.getPublicKey().toString();
      return [
        new KwilSigner(
          kwilNep413Signer("idos-grantee")(signer),
          implicitAddressFromPublicKey(publicKey),
          "nep413",
        ),
        publicKey,
      ];
    }
    default:
      return assertNever(chainType, `Unexpected chainType: ${chainType}`);
  }
};

interface idOSGranteeInitParams {
  encryptionPrivateKey: string;
  nodeUrl?: string;
  chainId?: string;
  dbId?: string;
  chainType: ChainType;
  granteeSigner: KeyPair | ethers.Wallet;
  granteeOptions?: EvmGrantsOptions | NearGrantsOptions;
}

const throwError = (message: string): never => {
  throw new Error(message);
};

export class idOSGrantee {
  noncedBox: NoncedBox;
  nodeKwil: NodeKwil;
  kwilSigner: KwilSigner;
  dbId: string;
  chainType: ChainType;
  address: string;
  grants?: GrantChild;

  static async init(_: {
    encryptionPrivateKey: string;
    nodeUrl?: string;
    chainId?: string;
    dbId?: string;
    chainType: "EVM";
    granteeSigner: ethers.Wallet;
    granteeOptions?: EvmGrantsOptions;
  }): Promise<idOSGrantee>;

  static async init(_: {
    encryptionPrivateKey: string;
    nodeUrl?: string;
    chainId?: string;
    dbId?: string;
    chainType: "NEAR";
    granteeSigner: KeyPair;
    granteeOptions?: NearGrantsOptions;
  }): Promise<idOSGrantee>;

  static async init({
    encryptionPrivateKey,
    nodeUrl = KwilWrapper.defaults.kwilProvider,
    chainId,
    dbId,
    chainType,
    granteeSigner,
    granteeOptions,
  }: idOSGranteeInitParams): Promise<idOSGrantee> {
    const kwil = new NodeKwil({ kwilProvider: nodeUrl, chainId: "" });

    chainId ||=
      // biome-ignore lint/style/noNonNullAssertion: I want to let it fall to throwError.
      (await kwil.chainInfo({ disableWarning: true })).data?.chain_id! ||
      throwError("Can't discover chainId. You must pass it explicitly.");

    dbId ||=
      // biome-ignore lint/style/noNonNullAssertion: I want to let it fall to throwError.
      (await kwil.listDatabases()).data?.filter(({ name }) => name === "idos")[0].dbid! ||
      throwError("Can't discover dbId. You must pass it explicitly.");

    const nodeKwil = new NodeKwil({ kwilProvider: nodeUrl, chainId });

    const [kwilSigner, address] = buildKwilSignerAndGrantee(chainType, granteeSigner);

    let grants: EvmGrants | undefined;
    switch (chainType) {
      case "EVM": {
        const signer = granteeSigner as ethers.Wallet;
        grants = await EvmGrants.init({
          // biome-ignore lint/suspicious/noExplicitAny: TBD.
          signer: signer as any,
          options: (granteeOptions ?? {}) as EvmGrantsOptions,
        });
        break;
      }
      case "NEAR": {
        grants = undefined;
        break;
      }
      default:
        grants = throwError(`Unknown chainType: ${chainType}`);
    }

    return new idOSGrantee(
      NoncedBox.fromBase64SecretKey(encryptionPrivateKey),
      nodeKwil,
      kwilSigner,
      dbId,
      chainType,
      address,
      grants,
    );
  }

  private constructor(
    noncedBox: NoncedBox,
    nodeKwil: NodeKwil,
    kwilSigner: KwilSigner,
    dbId: string,
    chainType: ChainType,
    address: string,
    grants: GrantChild | undefined,
  ) {
    this.noncedBox = noncedBox;
    this.nodeKwil = nodeKwil;
    this.kwilSigner = kwilSigner;
    this.dbId = dbId;
    this.chainType = chainType;
    this.address = address;
    this.grants = grants;
  }

  async fetchSharedCredentialFromIdos<T extends Record<string, unknown>>(
    dataId: string,
  ): Promise<T> {
    return (
      (await this.nodeKwil.call(
        {
          name: "get_credential_shared",
          dbid: this.dbId,
          inputs: [{ $id: dataId }],
        },
        this.kwilSigner,
        // biome-ignore lint/suspicious/noExplicitAny: NodeKwil doesn't have the best type defs.
      )) as any
    ).data.result[0] as unknown as T;
  }

  async getSharedCredentialContentDecrypted(dataId: string): Promise<string> {
    const credentialCopy = await this.fetchSharedCredentialFromIdos<{
      content: string;
      encryptor_public_key: string;
    }>(dataId);

    return await this.noncedBox.decrypt(
      credentialCopy.content,
      credentialCopy.encryptor_public_key,
    );
  }

  /**
   * Returns the list of Access Grants that are present in the network that granteeSigner is connected to.
   *
   * If you need to gather AGs from more than one chain, consider instantiating this class once per chain, and do
   * something like so:
   * <code>
   *   const AllIdOSGrantees = [
   *     await idOSGrantee.init({args: "for", chain: "one"}),
   *     await idOSGrantee.init({args: "for", chain: "two"}),
   *   ]
   *   const allUserAGs = (await Promise.all(allIdOSGrantees.map(
   *     (idOSGrantee) => idOSGrantee.getLocalAccessGrantsFromUserByAddress(address),
   *   ))).flat()
   * </code>
   *
   * @param address The user's address.
   */
  async getLocalAccessGrantsFromUserByAddress(address: string): Promise<Grant[]> {
    if (!this.grants) throw new Error("NEAR is not implemented yet");

    return this.grants.list({
      ownerAddress: address,
      granteeAddress: this.grantee,
    });
  }

  async createBySignature(
    ...args: Parameters<GrantChild["createBySignature"]>
  ): ReturnType<GrantChild["createBySignature"]> {
    if (!this.grants) throw new Error("NEAR is not implemented yet");

    return this.grants.createBySignature(...args);
  }

  async revokeBySignature(
    ...args: Parameters<GrantChild["revokeBySignature"]>
  ): ReturnType<GrantChild["revokeBySignature"]> {
    if (!this.grants) throw new Error("NEAR is not implemented yet");

    return this.grants.revokeBySignature(...args);
  }

  get grantee() {
    return this.address;
  }

  get encryptionPublicKey() {
    return Base64Codec.encode(this.noncedBox.keyPair.publicKey);
  }
}
