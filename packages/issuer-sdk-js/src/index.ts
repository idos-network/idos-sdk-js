import { KwilSigner, NodeKwil, Utils } from "@kwilteam/kwil-js";
import { JsonRpcProvider, Wallet } from "ethers";

interface CreateProfileReqParams {
  human_id: string;
  wallet_id: string;
  address: string;
  public_key: string;
  message: string;
  signature: string;
}

// Dummy values for now.
const PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const DB_ID = "0x1234567890123456789012345678901234567890";

export async function createProfile(params: CreateProfileReqParams) {
  const kwil = new NodeKwil({
    kwilProvider: "",
    chainId: "",
  });

  const wallet = new Wallet(PRIVATE_KEY, new JsonRpcProvider("<idOS_NODE_URL>"));

  const response = await kwil.execute(
    {
      name: "add_human_as_inserter",
      dbid: DB_ID,
      inputs: [
        Utils.ActionInput.fromObject(
          Object.fromEntries(Object.entries(params).map(([key, value]) => [`$${key}`, value])),
        ),
      ],
    },
    new KwilSigner(wallet, wallet.address),
    true,
  );

  return response.data?.tx_hash;
}
