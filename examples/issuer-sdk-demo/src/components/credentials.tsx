import { useSdkStore } from "@/stores/sdk";
import { useDisclosure } from "@heroui/react";
import type { idOSCredential } from "@idos-network/idos-sdk";

import { revokeCredentialById } from "@/actions";
import { useState } from "react";
import { CredentialCard } from "./credential-card";
import CredentialContent from "./credential-content";

export function Credentials({
  credentials,
  onRefresh,
}: {
  credentials: idOSCredential[];
  onRefresh: () => void;
}) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedCredentialId, setSelectedCredentialId] = useState("");
  const { sdk } = useSdkStore();

  if (!credentials.length) {
    return null;
  }

  const onViewDetails = async (id: string) => {
    await sdk?.enclave.ready();

    setSelectedCredentialId(id);
    onOpen();
  };

  const onRevoke = async (id: string) => {
    await revokeCredentialById(id);
    onRefresh();
  };

  return (
    <div className="flex flex-col gap-4" id="credentials-list">
      {credentials.map((item) => (
        <CredentialCard
          key={item.id}
          credential={item}
          onRevoke={onRevoke}
          onViewDetails={onViewDetails}
        />
      ))}
      {selectedCredentialId ? (
        <CredentialContent id={selectedCredentialId} isOpen={isOpen} onOpenChange={onOpenChange} />
      ) : null}
    </div>
  );
}
