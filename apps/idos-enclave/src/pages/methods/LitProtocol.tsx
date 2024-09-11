import { difference } from "lodash-es";
import React, { useEffect, useMemo, useState } from "preact/compat";
import { Paragraph } from "../../components/Paragraph";
//@ts-ignore
import { Enclave } from "../../lib/enclave";
//@ts-ignore
import { base64ToUint8Array, fromUintToString } from "../../lib/format";
//@ts-ignore
import { Lit } from "../../lib/lit";
import type { MethodProps } from "./Chooser";

type LoadingMsg = "initialziingLit" | "generatingKey" | "storingKey" | "retrivingKey";

export interface StorableData<T = string> {
  key: string;
  value: T;
}

const loadingMsgSrc: Record<LoadingMsg, string> = {
  initialziingLit: "Initializing Lit protocol...",
  generatingKey: "Generating a key for you...",
  retrivingKey: "Retriving stored key...",
  storingKey: "Storing the generated key...",
} as const;

export default function LitProtocol({ onSuccess, store }: MethodProps) {
  const [laodingProperty, setLoadingProperty] = useState<LoadingMsg | "">("");
  const litInstance = useMemo(() => new Lit("ethereum", store), [store]);

  const ciphertext = store.get("lit-ciphertext");
  const dataToEncryptHash = store.get("lit-dataToEncryptHash");

  const startLoading = (newLoadingProp: LoadingMsg) => setLoadingProperty(newLoadingProp);

  const updateStoredCipherAndHash = (cipher: string, dataHash: string) => {
    store.set("lit-ciphertext", cipher);
    store.set("lit-dataToEncryptHash", dataHash);
  };

  const retriveLitKey = async (prevUserWallets = [], newUserWallets = [], walletsChanged) => {
    startLoading("retrivingKey");
    const key = await litInstance.decrypt(ciphertext, dataToEncryptHash, prevUserWallets);

    if (walletsChanged) {
      // re-encrypt here and removing previous signature info. new encryption means previous signature wont work
      localStorage.removeItem("lit-session-key");
      localStorage.removeItem("lit-wallet-sig");
      const { ciphertext: newCipher, dataToEncryptHash: newDataHash } = await litInstance.encrypt(
        key,
        newUserWallets,
      );
      updateStoredCipherAndHash(newCipher, newDataHash);
    }
    if (!key) throw new Error("error happened while decrypting user password");
    onSuccess({ password: key });
  };

  const createAndStoreKey = async (userWallets: string[]): Promise<StorableData[]> => {
    try {
      startLoading("generatingKey");
      const randomKey = await Enclave.generateRandomeKey(); // Uint8Array(32)
      const keyAsString = fromUintToString(randomKey); // plaintext string

      startLoading("storingKey");

      const { ciphertext, dataToEncryptHash } = await litInstance.encrypt(keyAsString, userWallets);
      if (!ciphertext || !dataToEncryptHash) throw new Error("Error at lit encryption process");

      // here u should ask the user to store these varaiable as attributes (also check if they're already stored)
      updateStoredCipherAndHash(ciphertext, dataToEncryptHash);

      onSuccess({ password: keyAsString });

      return [
        { key: "lit-ciphertext", value: ciphertext },
        { key: "lit-dataToEncryptHash", value: dataToEncryptHash },
      ];
    } catch (error) {
      console.error({ error });
    }
  };

  const getOrStoreLitKey = async () => {
    store.set("preferred-auth-method", "lit");

    const userWallets = store.get("user-wallets") || [];
    const newUserWallets = store.get("new-user-wallets");

    const hasDiff =
      (newUserWallets.length !== userWallets.length ||
        !!difference(userWallets, newUserWallets).length) &&
      !!userWallets.length;

    store.set("user-wallets", newUserWallets);

    if (ciphertext && dataToEncryptHash) {
      retriveLitKey(userWallets, newUserWallets, hasDiff);
    } else {
      createAndStoreKey(newUserWallets); // no need to re-encrypt
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (!litInstance) return;
    setLoadingProperty("initialziingLit");
    litInstance.connect().then(getOrStoreLitKey);
  }, [litInstance]);

  const loadingMsg = loadingMsgSrc?.[laodingProperty];

  return (
    <span style={{ color: "white", fontSize: "16px" }}>
      <Paragraph>{loadingMsg}</Paragraph>
    </span>
  );
}
