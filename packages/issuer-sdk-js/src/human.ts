import { Utils } from "@kwilteam/kwil-js";
import type { CreateIssuerConfig } from "./create-issuer-config";

export interface CreateProfileReqParams {
  id: string;
  current_public_key: string;
}

export async function createHumanProfile(
  { dbid, kwilClient, signer }: CreateIssuerConfig,
  params: CreateProfileReqParams,
) {
  const response = await kwilClient.execute(
    {
      name: "add_human_as_inserter",
      dbid,
      inputs: [
        Utils.ActionInput.fromObject(
          Object.fromEntries(Object.entries(params).map(([key, value]) => [`$${key}`, value])),
        ),
      ],
    },
    signer,
    true,
  );

  return response.data?.tx_hash;
}
