import { decode } from "ripple-binary-codec";
import type { Xumm } from "xumm";

type UserPubkey = string;

async function getXamanAccount(xummInstance: Xumm): Promise<string | undefined> {
  return await xummInstance.user.account;
}

export async function getXamanPublicKey(xummInstance: Xumm): Promise<UserPubkey> {
  const account = await getXamanAccount(xummInstance);

  return new Promise((resolve, reject) => {
    if (!account) reject("No account found");

    xummInstance.payload?.createAndSubscribe(
      {
        TransactionType: "SignIn",
        custom_meta: {
          identifier: "idos-data-dashboard",
          instruction: "Sign in to idOS Data Dashboard",
        },
      },

      async (event) => {
        if (!event.payload.response.hex) return;
        const hex = event.payload.response.hex;
        if (!hex) reject("Failed to create transaction");

        const decodedTx = decode(hex);
        resolve(decodedTx.SigningPubKey as string);
      },
    );
  });
}
