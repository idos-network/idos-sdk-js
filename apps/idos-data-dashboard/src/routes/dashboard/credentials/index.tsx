import { Box, Button, Flex, useDisclosure } from "@chakra-ui/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { RemoveCredential } from "@/routes/dashboard/credentials/components/remove-credential.tsx";
import { ShareCredential } from "@/routes/dashboard/credentials/components/share-credential.tsx";
import { SharesEditor } from "@/routes/dashboard/credentials/components/shares-editor.tsx";
import { CredentialEditor } from "./components/credential-editor";
import { CredentialViewer } from "./components/credential-viewer";
import { CredentialsTable } from "./components/credentials-table";
import { useFetchCredentials } from "./queries";
import { Credential } from "./types";

export function Component() {
  const { t } = useTranslation();
  const [credential, setCredential] = useState<Credential>();

  const {
    isOpen: isEditorOpen,
    onOpen: onEditorOpen,
    onClose: onEditorClose
  } = useDisclosure();
  const {
    isOpen: isViewerOpen,
    onOpen: onViewerOpen,
    onClose: onViewerClose
  } = useDisclosure();
  const {
    isOpen: isRemoveOpen,
    onOpen: onRemoveOpen,
    onClose: onRemoveClose
  } = useDisclosure();
  const {
    isOpen: isShareOpen,
    onOpen: onShareOpen,
    onClose: onShareClose
  } = useDisclosure();
  const {
    isOpen: isSharesEditorOpen,
    onOpen: onSharesEditorOpen,
    onClose: onSharesEditorClose
  } = useDisclosure();

  const credentials = useFetchCredentials({
    select: (data) =>
      data
        ?.filter(({ original_id }) => original_id === "")
        .map((credential) => ({
          ...credential,
          shares: data
            .filter((c) => c.original_id === credential.id)
            .map((c) => c.id)
        }))
  });

  const handleOnEditorClose = () => {
    setCredential(undefined);
    onEditorClose();
  };

  const handleOnViewerClose = () => {
    setCredential(undefined);
    onViewerClose();
  };

  const onCredentialEdit = (credential: Credential) => {
    setCredential(credential);
    onEditorOpen();
  };

  const onCredentialView = (credential: Credential) => {
    setCredential(credential);
    onViewerOpen();
  };

  const handleCredentialRemove = (credential: Credential) => {
    setCredential(credential);
    onRemoveOpen();
  };

  const handleCredentialRemoveClose = () => {
    setCredential(undefined);
    onRemoveClose();
  };

  const onCredentialShare = (credential: Credential) => {
    setCredential(credential);
    onShareOpen();
  };

  const onCredentialShareClose = () => {
    setCredential(undefined);
    onShareClose();
  };

  const onViewCredentialShares = (credential: Credential) => {
    setCredential(credential);
    onSharesEditorOpen();
  };

  const onViewCredentialSharesClose = () => {
    setCredential(undefined);
    onSharesEditorClose();
  };

  return (
    <Box>
      <Flex align="center" justify="end" mb={5}>
        <Button colorScheme="green" onClick={onEditorOpen} variant="outline">
          {t("new-credential")}
        </Button>
      </Flex>

      <CredentialsTable
        isLoading={credentials.isFetching}
        credentials={credentials.data}
        onCredentialRemove={handleCredentialRemove}
        onCredentialView={onCredentialView}
        onCredentialEdit={onCredentialEdit}
        onCredentialShare={onCredentialShare}
        onViewCredentialShares={onViewCredentialShares}
      />

      <CredentialEditor
        isOpen={isEditorOpen}
        onClose={handleOnEditorClose}
        credential={credential}
      />
      <CredentialViewer
        isOpen={isViewerOpen}
        onClose={handleOnViewerClose}
        credential={credential}
      />
      <RemoveCredential
        isOpen={isRemoveOpen}
        onClose={handleCredentialRemoveClose}
        credential={credential}
      />
      <ShareCredential
        credential={credential}
        isOpen={isShareOpen}
        onClose={onCredentialShareClose}
      />
      <SharesEditor
        credential={credential}
        isOpen={isSharesEditorOpen}
        onClose={onViewCredentialSharesClose}
      />
    </Box>
  );
}
