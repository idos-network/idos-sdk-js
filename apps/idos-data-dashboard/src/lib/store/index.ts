import { JsonRpcSigner } from "ethers";
import { atom, createStore } from "jotai";
import { InMemorySigner } from "near-api-js";
import {type Signer} from 'near-api-js'

export const store = createStore();
export const signerAtom = atom<JsonRpcSigner | InMemorySigner | Signer | undefined>(undefined);
export const publicKeyAtom = atom<string>("");
export const accountAtom = atom<string>("");

export function setupStoreValues(
  signer: JsonRpcSigner | InMemorySigner | Signer | undefined,
  publicKey: string,
  account: string
) {
  store.set(signerAtom, signer);
  store.set(publicKeyAtom, publicKey);
  store.set(accountAtom, account);
}
