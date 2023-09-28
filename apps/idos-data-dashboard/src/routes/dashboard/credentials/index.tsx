import { Box, Button, Flex, useDisclosure } from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { RemoveCredential } from "@/routes/dashboard/credentials/components/remove-credential.tsx";
import { SharesEditor } from "@/routes/dashboard/credentials/components/shares-editor.tsx";
import { CredentialEditor } from "./components/credential-editor";
import { CredentialViewer } from "./components/credential-viewer";
import { CredentialsTable } from "./components/credentials-table";
import { ShareCredential } from "./components/share-credential";
import { useFetchCredentials } from "./queries";
import { Credential } from "./types";

export function Component() {
  const { t } = useTranslation();
  const [credential, setCredential] = useState<Credential>();

  const { isOpen: isEditorOpen, onOpen: onEditorOpen, onClose: onEditorClose } = useDisclosure();
  const { isOpen: isViewerOpen, onOpen: onViewerOpen, onClose: onViewerClose } = useDisclosure();
  const { isOpen: isRemoveOpen, onOpen: onRemoveOpen, onClose: onRemoveClose } = useDisclosure();
  const { isOpen: isSharesEditorOpen, onOpen: onSharesEditorOpen, onClose: onSharesEditorClose } = useDisclosure();
  const { isOpen: isShareOpen, onOpen: onShareOpen, onClose: onShareClose } = useDisclosure();

  const credentials = useFetchCredentials();

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

  const handleShareOpen = (credential: Credential) => {
    setCredential(credential);
    onShareOpen();
  };

  const handleShareClose = () => {
    setCredential(undefined);
    onShareClose();
  };

  const handleSharesEditorOpen = (credential: Credential) => {
    setCredential(credential);
    onSharesEditorOpen();
  };

  const handleSharesEditorClose = () => {
    setCredential(undefined);
    onSharesEditorClose();
  };

  const ownCredentials = useMemo(
    () =>
      credentials.data
        ?.filter(({ original_id }) => original_id === "")
        .map((credential) => ({
          ...credential,
          shares: credentials.data.filter((c) => c.original_id === credential.id).map((c) => c.id),
        })),
    [credentials.data]
  );
  return (
    <Box>
      <Flex align="center" justify="end" mb={5}>
        <Button colorScheme="green" onClick={onEditorOpen} variant="outline">
          {t("new-credential")}
        </Button>
      </Flex>

      <CredentialsTable
        isLoading={credentials.isFetching}
        credentials={ownCredentials}
        onCredentialRemove={handleCredentialRemove}
        onCredentialView={onCredentialView}
        onCredentialEdit={onCredentialEdit}
        onViewCredentialShares={handleSharesEditorOpen}
        onCredentialShare={handleShareOpen}
      />

      <CredentialEditor isOpen={isEditorOpen} onClose={handleOnEditorClose} credential={credential} />
      <CredentialViewer isOpen={isViewerOpen} onClose={handleOnViewerClose} credential={credential} />
      <RemoveCredential isOpen={isRemoveOpen} onClose={handleCredentialRemoveClose} credential={credential} />
      <ShareCredential isOpen={isShareOpen} onClose={handleShareClose} credential={credential} />
      <SharesEditor isOpen={isSharesEditorOpen} onClose={handleSharesEditorClose} credential={credential} />
    </Box>
  );
}
