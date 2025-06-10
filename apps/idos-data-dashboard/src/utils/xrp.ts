import { decode } from "ripple-binary-codec";
import { Xumm } from "xumm";

type UserPubkey = string;

export const xummInstance = new Xumm(
  import.meta.env.VITE_XUMM_API_KEY,
  import.meta.env.VITE_XUMM_API_SECRET,
);

export const connectXrp = async () => {
  const connect = await xummInstance.authorize();
  return connect;
};

export const getXrpPublicKey = async (): Promise<UserPubkey> => {
  const account = await xummInstance.user.account;
  return new Promise((resolve, reject) => {
    xummInstance.payload?.createAndSubscribe(
      {
        TransactionType: "SignIn",
        Account: account,
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
};
