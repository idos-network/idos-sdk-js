import { createContext, useContext, useEffect, useState } from "react";
import Loader from "../components/Loader";
import { Current, fetchCurrent } from "./api";

export interface CurrentContextType {
  current: Current;
  path: string | null;
  update: () => void;
}

export function derivedPath(current: Current) {
  if (current.error) return "/";
  const user = current.user;

  if (!current.loggedIn || !user) return "/steps/wallet";

  const dagAvailable = current.application?.grantee && current.application?.publicEncryptionKey;
  const sumSubApproved = user.sumSubStatus === "approved";
  const idosPasswordGenerated = user.idosPubKey && user.idosCredentialId;
  const dagGranted = dagAvailable && user.idosGrantTransactionId;

  if (sumSubApproved && idosPasswordGenerated && (dagAvailable ? dagGranted : true))
    return "/steps/done";
  if (sumSubApproved && idosPasswordGenerated && dagAvailable) return "/steps/share";
  if (sumSubApproved) return "/steps/idos";

  // Kyc (user is authorized but not approved)
  return "/steps/kyc";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CurrentContext = createContext<CurrentContextType>({} as any);

export const useCurrent = () => useContext(CurrentContext);

export default function CurrentContextProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<Current | null>(null);
  const [path, setPath] = useState<string | null>(null);

  const update = () => {
    fetchCurrent().then(setCurrent);
  };

  useEffect(() => update(), []);

  useEffect(() => {
    if (!current) return;

    const expectedPath = derivedPath(current);
    if (expectedPath !== path) setPath(expectedPath);
  }, [current]);

  if (!current) return <Loader />;

  return (
    <CurrentContext.Provider value={{ current, update, path }}>{children}</CurrentContext.Provider>
  );
}
