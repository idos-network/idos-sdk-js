import axios from "axios";

interface GranteeInfo {
  encryptionPublicKey: string;
  lockTimeSpanSeconds: number;
  grantee: string;
}

export const getInfo = async (walletType: string): Promise<GranteeInfo> => {
  return (await axios.get<GranteeInfo>(`/api/${walletType}`)).data;
};

export const fetchAndDecryptSharedCredential = async (
  walletType: string,
  dataId: string
): Promise<string> => {
  return (await axios.post<string>(`/api/${walletType}`, { dataId })).data;
};
