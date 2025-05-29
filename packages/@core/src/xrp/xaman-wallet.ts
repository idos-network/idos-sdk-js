import { decode } from "ripple-binary-codec";
import type { Xumm } from "xumm";

type UserPubkey = string;

const getXamanAccount = async (xummInstance: Xumm): Promise<string | undefined> => {
  const account = await xummInstance.user.account;
  return account;
};

export const getXamanPublicKey = async (xummInstance: Xumm): Promise<UserPubkey> => {
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
        console.log({ event });
        const hex = event.payload.response.hex;
        if (!hex) reject("Failed to create transaction");

        const decodedTx = decode(hex);
        resolve(decodedTx.SigningPubKey as string);
      },
    );
  });
};
