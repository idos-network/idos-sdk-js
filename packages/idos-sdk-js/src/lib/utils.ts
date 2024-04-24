import { decodeBase58, toBeHex } from "ethers";
import * as nearAPI from "near-api-js";

export async function getNearFullAccessPublicKeys(
  namedAddress: string,
): Promise<string[] | undefined> {
  const { connect } = nearAPI;
  const connectionConfig = {
    networkId: import.meta.env.VITE_IDOS_NEAR_DEFAULT_NETWORK,
    nodeUrl: import.meta.env.VITE_IDOS_NEAR_DEFAULT_RPC_URL,
  };
  const nearConnection = await connect(connectionConfig);

  try {
    const response = await nearConnection.connection.provider.query({
      request_type: "view_access_key_list",
      finality: "final",
      account_id: namedAddress,
    });
    return response.keys
      .filter((element: object) => element.access_key.permission === "FullAccess")
      ?.map((i) => i.public_key);
  } catch {
    // near failed if namedAddress contains uppercase symbols
    return;
  }
}

export function implicitAddressFromPublicKey(publicKey: string) {
  const key_without_prefix = publicKey.replace(/^ed25519:/, "");
  const implicitAddress = toBeHex(decodeBase58(key_without_prefix));
  return implicitAddress;
}
