import { decrypt } from "@/utils/crypto";
import type { idOSCredential } from "@idos-network/idos-sdk";
import { useEffect, useState } from "react";

export default function useCredentialContent(credential: idOSCredential, secretKey: string) {
  const [data, setData] = useState<string>("");
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (!secretKey || !credential?.content) return;
    setIsFetching(true);
    decrypt(credential.content, credential.encryption_public_key, secretKey)
      .then(setData)
      .finally(() => setIsFetching(false));
  }, [!!credential, secretKey]);

  return { data, isFetching };
}
