// This file is auto-generated from an abi-file using AbiCodegen.
/* eslint-disable */
// @ts-nocheck
// noinspection ES6UnusedImports
import {
  AbiBitInput,
  AbiBitOutput,
  AbiByteInput,
  AbiByteOutput,
  type AbiInput,
  type AbiOutput,
  AvlTreeMap,
  type BlockchainAddress,
  BlockchainPublicKey,
  type BlockchainStateClient,
  BlsPublicKey,
  BlsSignature,
  BN,
  Hash,
  SecretInputBuilder,
  Signature,
  type StateWithClient,
} from "@partisiablockchain/abi-client";

type Option<K> = K | undefined;
export class IdosContract {
  private readonly _client: BlockchainStateClient | undefined;
  private readonly _address: BlockchainAddress | undefined;

  public constructor(
    client: BlockchainStateClient | undefined,
    address: BlockchainAddress | undefined,
  ) {
    this._address = address;
    this._client = client;
  }
  public deserializeContractState(_input: AbiInput): ContractState {
    const nodes_vecLength = _input.readI32();
    const nodes: NodeConfig[] = [];
    for (let nodes_i = 0; nodes_i < nodes_vecLength; nodes_i++) {
      const nodes_elem: NodeConfig = this.deserializeNodeConfig(_input);
      nodes.push(nodes_elem);
    }
    return { nodes };
  }
  public deserializeNodeConfig(_input: AbiInput): NodeConfig {
    const address: BlockchainAddress = _input.readAddress();
    const endpoint: string = _input.readString();
    return { address, endpoint };
  }
  public async getState(): Promise<ContractState> {
    const bytes = await this._client?.getContractStateBinary(this._address!);
    if (bytes === undefined) {
      throw new Error("Unable to get state bytes");
    }
    const input = AbiByteInput.createLittleEndian(bytes);
    return this.deserializeContractState(input);
  }
}
export interface ContractState {
  nodes: NodeConfig[];
}

export interface NodeConfig {
  address: BlockchainAddress;
  endpoint: string;
}
function serializeNodeConfig(_out: AbiOutput, _value: NodeConfig): void {
  const { address, endpoint } = _value;
  _out.writeAddress(address);
  _out.writeString(endpoint);
}

export function initialize(nodes: NodeConfig[]): Buffer {
  return AbiByteOutput.serializeBigEndian((_out) => {
    _out.writeBytes(Buffer.from("ffffffff0f", "hex"));
    _out.writeI32(nodes.length);
    for (const nodes_vec of nodes) {
      serializeNodeConfig(_out, nodes_vec);
    }
  });
}

export function deserializeState(state: StateWithClient): ContractState;
export function deserializeState(bytes: Buffer): ContractState;
export function deserializeState(
  bytes: Buffer,
  client: BlockchainStateClient,
  address: BlockchainAddress,
): ContractState;
export function deserializeState(
  state: Buffer | StateWithClient,
  client?: BlockchainStateClient,
  address?: BlockchainAddress,
): ContractState {
  if (Buffer.isBuffer(state)) {
    const input = AbiByteInput.createLittleEndian(state);
    return new IdosContract(client, address).deserializeContractState(input);
  }
  const input = AbiByteInput.createLittleEndian(state.bytes);
  return new IdosContract(state.client, state.address).deserializeContractState(input);
}
