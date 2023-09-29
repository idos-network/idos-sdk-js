import { Types } from "@kwilteam/kwil-js";
import { InMemorySigner } from "near-api-js";
import { createQuery } from "react-query-kit";
import invariant from "tiny-invariant";

import { dbId, kwil } from "@/lib/db";
import { accountAtom, publicKeyAtom, signerAtom, store } from "@/lib/store";
import { HumanId, castToType } from "@/lib/types";

import ActionInput = Types.ActionInput;

export async function buildMsg(action: string, inputs?: ActionInput) {
  const signer = store.get(signerAtom);
  const publicKey = store.get(publicKeyAtom);

  invariant(signer, "No signer found");
  invariant(publicKey, "No public key found");

  let payload = kwil.actionBuilder().dbid(dbId).publicKey(publicKey).signer(signer).name(action);

  if (inputs) {
    payload = payload.concat(inputs);
  }

  if (signer instanceof InMemorySigner) {
    const account = store.get(accountAtom);
    invariant(account, "No account found");
    payload = payload.nearConfig(account, "testnet");
  }

  return await payload.buildMsg();
}

export const useFetchWalletHumanId = createQuery({
  primaryKey: "human_id",
  queryFn: async () => {
    const tx = await buildMsg("get_wallet_human_id");
    return kwil.call(tx).then((res) => castToType<HumanId[]>(res.data?.result || []).at(0)?.human_id);
  },
});
