import { useSdkStore } from "@/stores/sdk";
import {
  Button,
  Code,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
} from "@heroui/react";
import React, { useCallback, useEffect, useState, useTransition } from "react";

export default function CredentialContent({
  id,
  isOpen,
  onOpenChange,
}: {
  id: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isLoadingCredentialContent, startCredentialContentTransition] = useTransition();
  const [content, setContent] = useState("");
  const { sdk: clientSDK } = useSdkStore();

  const checkCredentialContent = useCallback(() => {
    startCredentialContentTransition(async () => {
      try {
        if (!clientSDK) throw new Error("No SDK found");
        const response = await clientSDK.data.get("credentials", id);
        if (!response?.content && typeof response?.content !== "string") return;
        setContent(JSON.parse(response.content));
      } catch (error) {
        console.log({ error });
      }
    });
  }, [id, clientSDK]);

  useEffect(() => {
    checkCredentialContent();
  }, [checkCredentialContent]);

  return (
    <Modal isOpen={isOpen} size="2xl" onOpenChange={onOpenChange}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">Credential details</ModalHeader>
            <ModalBody>
              {isLoadingCredentialContent ? (
                <Spinner />
              ) : (
                <Code size="lg" className="h-96 overflow-auto">
                  <pre>{JSON.stringify(content, null, 2)}</pre>
                </Code>
              )}
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose} id="close-btn">
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
