import { Lit } from "@idos-network/idos-sdk";
import { encode as fromUintToString } from "@stablelib/base64";
import { difference } from "lodash-es";
import React, { useEffect, useMemo, useState } from "preact/compat";
import { Paragraph } from "../../components/Paragraph";
//@ts-ignore
import { Enclave } from "../../lib/enclave";
import type { MethodProps } from "./Chooser";

type LoadingMsg = "initializingLit" | "generatingKey" | "storingKey" | "retrievingKey";

export interface StorableData<T = string> {
  key: string;
  value: T;
}

const loadingMsgSrc: Record<LoadingMsg, string> = {
  initializingLit: "Initializing Lit protocol...",
  generatingKey: "Generating a key for you...",
  retrievingKey: "Retriving stored key...",
  storingKey: "Storing the generated key...",
} as const;

export default function LitProtocol({ onSuccess, store }: MethodProps) {
  const [laodingProperty, setLoadingProperty] = useState<LoadingMsg>("initializingLit");
  const litInstance = useMemo(() => new Lit("ethereum", store), [store]);

  const ciphertext = store.get("lit-cipher-text");
  const dataToEncryptHash = store.get("lit-data-to-encrypt-hash");

  const startLoading = (newLoadingProp: LoadingMsg) => setLoadingProperty(newLoadingProp);

  const updateStoredCipherAndHash = (cipher: string, dataHash: string) => {
    store.set("lit-cipher-text", cipher);
    store.set("lit-data-to-encrypt-hash", dataHash);
  };

  // const checkEncryption

  // biome-ignore lint/style/useDefaultParameterLast: <explanation>
  const retriveLitKey = async (
    prevUserWallets = [],
    newUserWallets = [],
    walletsChanged = false,
  ) => {
    startLoading("retrievingKey");
    const key = await litInstance.decrypt(ciphertext, dataToEncryptHash, prevUserWallets);

    if (walletsChanged) {
      // re-encrypt here and removing previous signature info. new encryption means previous signature wont work
      localStorage.removeItem("lit-session-key");
      localStorage.removeItem("lit-wallet-sig");
      const encryptionResult = await litInstance.encrypt(key, newUserWallets);
      if (!encryptionResult?.ciphertext)
        throw new Error("Error happend while encrypting your key!");

      const { ciphertext, dataToEncryptHash } = encryptionResult;
      updateStoredCipherAndHash(ciphertext, dataToEncryptHash);
    }
    if (!key) throw new Error("error happened while decrypting user password");
    onSuccess({ password: "752@Hi-idos" || key });
  };

  const createAndStoreKey = async (userWallets: string[]) => {
    try {
      startLoading("generatingKey");
      const randomKey = await Enclave.generateRandomeKey(); // Uint8Array(32)
      const keyAsString = fromUintToString(randomKey); // plaintext string

      startLoading("storingKey");

      const encryptionResult = await litInstance.encrypt(keyAsString, userWallets);
      if (!encryptionResult?.ciphertext)
        throw new Error("Error happend while encrypting your key!");
      const { ciphertext, dataToEncryptHash } = encryptionResult;
      if (!ciphertext || !dataToEncryptHash) throw new Error("Error at lit encryption process");

      // here u should ask the user to store these varaiable as attributes (also check if they're already stored)
      updateStoredCipherAndHash(ciphertext, dataToEncryptHash);

      onSuccess({ password: "752@Hi-idos" || keyAsString });
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
    setLoadingProperty("initializingLit");
    litInstance.connect().then(getOrStoreLitKey);
  }, [litInstance]);

  const loadingMsg = loadingMsgSrc?.[laodingProperty];

  return (
    <span style={{ color: "white", fontSize: "16px" }}>
      <Paragraph>{loadingMsg}</Paragraph>
    </span>
  );
}
