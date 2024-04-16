import axios from "axios";

interface GranteeInfo {
  encryptionPublicKey: string;
  lockTimeSpanSeconds: number;
  grantee: {
    EVM: string;
    NEAR: string;
  };
}

type WalletType = keyof GranteeInfo["grantee"];

export const getInfo = async (walletType: WalletType): Promise<GranteeInfo> => {
  return (await axios.get<GranteeInfo>(`/api/${walletType}`)).data;
};

export const fetchAndDecryptSharedCredential = async (
  walletType: WalletType,
  dataId: string
): Promise<string> => {
  return (await axios.post<string>(`/api/${walletType}`, { dataId })).data;
};
