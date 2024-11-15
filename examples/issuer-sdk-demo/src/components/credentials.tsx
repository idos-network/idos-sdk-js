import { useSdkStore } from "@/stores/sdk";
import type { idOSCredential } from "@idos-network/idos-sdk";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Divider,
  useDisclosure,
} from "@nextui-org/react";
import { CommandIcon } from "lucide-react";
import { useState } from "react";
import CredentialContent from "./credential-content";

export function Credentials({ credentials }: { credentials: idOSCredential[] }) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedCredentialId, setSelectedCredentialId] = useState("");
  const { sdk } = useSdkStore();

  if (!credentials.length) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {credentials.map((item) => (
        <Card key={item.id}>
          <CardHeader className="flex gap-3">
            <div className="inline-flex items-center justify-center rounded-lg bg-indigo-600 p-2">
              <CommandIcon size={24} className="text-white" />
            </div>
            <div className="flex flex-col">
              <p className="text-md">{item.issuer}</p>
            </div>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-2">
            <p className="text-neutral-600 text-small">Type: {item.credential_type}</p>
            <p className="text-neutral-600 text-sm capitalize">Status: {item.credential_status}</p>
          </CardBody>
          <Divider />
          <CardFooter className="flex justify-end">
            <Button
              color="primary"
              variant="solid"
              onClick={async () => {
                await sdk?.enclave.ready();
                setSelectedCredentialId(item.id);
                onOpen();
              }}
            >
              View credential details
            </Button>
          </CardFooter>
        </Card>
      ))}
      {selectedCredentialId ? (
        <CredentialContent id={selectedCredentialId} isOpen={isOpen} onOpenChange={onOpenChange} />
      ) : null}
    </div>
  );
}
