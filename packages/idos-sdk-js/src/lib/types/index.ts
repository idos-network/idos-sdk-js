export type StorableAttribute = {
  key: string;
  value: string | string[];
};

export type BackupPasswordInfo = {
  data: {
    payload: {
      accessControlConditions: string[];
      passwordCiphers: { ciphertext: string; dataToEncryptHash: string };
    };
  };
};
