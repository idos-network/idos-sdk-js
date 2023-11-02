import { Breadcrumbs } from "#/lib/components/breadcrumbs";
import { Title } from "#/lib/components/title";
import { TitleBar } from "#/lib/components/title-bar";
import { DeleteCredential } from "#/routes/dashboard/credentials/components/delete-credential";
import {
  AbsoluteCenter,
  Box,
  Button,
  Flex,
  Spinner,
  Stack,
  Text,
  useDisclosure
} from "@chakra-ui/react";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { AddCredentialCard } from "./components/add-credential-card";
import { AddProofOfPersonhood } from "./components/add-proof-of-personhood";
import { CredentialCard } from "./components/credential-card";
import { CredentialViewer } from "./components/credential-viewer";
import { Credential, useFetchCredentials } from "./queries";

export function Component() {
  const {
    isOpen: isAddProofOpen,
    onOpen: onAddProofOpen,
    onClose: onAddProofClose
  } = useDisclosure();

  const {
    isOpen: isViewCredentialOpen,
    onOpen: onCredentialViewerOpen,
    onClose: onCredentialViewerClose
  } = useDisclosure();

  const {
    isOpen: isCredentialDeleteOpen,
    onOpen: onCredentialDeleteOpen,
    onClose: onCredentialDeleteClose
  } = useDisclosure();

  const credentials = useFetchCredentials();
  const [credential, setCredential] = useState<Credential | undefined>();

  const handleOpenCredentialViewer = (credential: Credential) => {
    setCredential(credential);
    onCredentialViewerOpen();
  };

  const handleCloseCredentialViewer = () => {
    setCredential(undefined);
    onCredentialViewerClose();
  };

  const onAddCredential = () => {
    onAddProofOpen();
  };

  const handleDeleteCredential = (credential: Credential) => {
    setCredential(credential);
    onCredentialDeleteOpen();
  };

  const handleDeleteCredentialClose = () => {
    setCredential(undefined);
    onCredentialDeleteClose();
  };

  return (
    <Box>
      <Stack flex={1} gap={2.5} ml={[0, 0, 0, 380]}>
        <Flex align="center" justify="space-between" h={125}>
          <Breadcrumbs items={["Dashboard", "Credentials"]} />
        </Flex>
        <Flex align="center" gap={2.5}>
          <TitleBar>
            <Title>Credentials</Title>
            {credentials.isLoading ? (
              <Spinner size="sm" />
            ) : (
              <Text>
                {credentials.data?.length}
                <Text as="span" mx={1} hideBelow="xl">
                  Connected Credentials
                </Text>
              </Text>
            )}
          </TitleBar>
          {credentials.data?.length === 0 ? (
            <Button
              colorScheme="green"
              hideBelow="lg"
              leftIcon={<PlusIcon size={24} />}
              onClick={onAddCredential}
              size="xl"
            >
              Add credential
            </Button>
          ) : null}
        </Flex>

        <Box>
          {credentials.isFetching ? (
            <AbsoluteCenter>
              <Spinner />
            </AbsoluteCenter>
          ) : null}
          {credentials.isSuccess ? (
            <>
              {credentials.data.length === 0 ? (
                <AddCredentialCard onAddCredential={onAddCredential} />
              ) : (
                credentials.data.map((credential) => (
                  <CredentialCard
                    key={credential.id}
                    credential={credential}
                    onViewDetails={handleOpenCredentialViewer}
                    onDelete={handleDeleteCredential}
                  />
                ))
              )}
            </>
          ) : null}
        </Box>
      </Stack>
      <AddProofOfPersonhood isOpen={isAddProofOpen} onClose={onAddProofClose} />
      {credential ? (
        <>
          <CredentialViewer
            credential={credential}
            isOpen={isViewCredentialOpen}
            onClose={handleCloseCredentialViewer}
          />
          <DeleteCredential
            isOpen={isCredentialDeleteOpen}
            credential={credential}
            onClose={handleDeleteCredentialClose}
          />
        </>
      ) : null}
    </Box>
  );
}

Component.displayname = "DashboardCredentials";
