import { Breadcrumbs } from "#/lib/components/breadcrumbs";
import { Title } from "#/lib/components/title";
import { TitleBar } from "#/lib/components/title-bar";
import { DeleteCredential } from "#/routes/dashboard/credentials/components/delete-credential.tsx";
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

  const onAddCredential = () => {
    onAddProofOpen();
  };

  const handleDeleteCredential = (credential: Credential) => {
    setCredential(credential);
    onCredentialDeleteOpen();
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
            <Text>
              0
              <Text as="span" mx={1} hideBelow="xl">
                Connected Credentials
              </Text>
            </Text>
          </TitleBar>
          <Button
            colorScheme="green"
            hideBelow="lg"
            onClick={onAddCredential}
            size="xl"
          >
            Add credential
          </Button>
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
            onClose={onCredentialViewerClose}
          />
          <DeleteCredential
            isOpen={isCredentialDeleteOpen}
            credential={credential}
            onClose={onCredentialDeleteClose}
          />
        </>
      ) : null}
    </Box>
  );
}

Component.displayname = "DashboardCredentials";
