import type { useFetchGrants } from "@/queries/use-fetch-grants";
import { DataListRoot, Stack } from "@chakra-ui/react";
import { Button, DataListItem, EmptyState } from "@idos-network/ui-kit";
import { useLocalStorage, useToggle } from "@uidotdev/usehooks";
import { useState } from "react";
import CredentialDetails from "./credential-details";
import SecretKeyPrompt from "./secret-key-prompt";

export type GrantsWithFormattedLockedUntil = NonNullable<ReturnType<typeof useFetchGrants>["data"]>;

export default function SearchResults({ results }: { results: GrantsWithFormattedLockedUntil }) {
  const [credentialId, setCredentialId] = useState("");
  const [openSecretKeyPrompt, toggleSecretKeyPrompt] = useToggle();
  const [, toggleCredentialDetails] = useToggle();
  const [secretKey, setSecretKey] = useLocalStorage("SECRET_KEY", "");

  if (!results.length) {
    return <EmptyState title="No results found" bg="gray.900" rounded="lg" />;
  }

  const onKeySubmit = async (secretKey: string) => {
    setSecretKey(secretKey);
  };

  const handleCredentialsDetails = async (grantId: string) => {
    setCredentialId(grantId);
    if (!secretKey) toggleSecretKeyPrompt();
  };

  return (
    <>
      {results.map((grant) => (
        <Stack key={crypto.randomUUID()} gap="6" bg="gray.900" p="6" rounded="md">
          <DataListRoot orientation="horizontal" divideY="1px">
            <DataListItem
              alignItems={{
                base: "flex-start",
                md: "center",
              }}
              flexDir={{
                base: "column",
                md: "row",
              }}
              pt="4"
              grow
              label="ID"
              value={grant.dataId}
              truncate
            />
            <DataListItem
              alignItems={{
                base: "flex-start",
                md: "center",
              }}
              flexDir={{
                base: "column",
                md: "row",
              }}
              pt="4"
              grow
              label="Owner"
              value={grant.owner}
              truncate
            />
            <DataListItem
              alignItems={{
                base: "flex-start",
                md: "center",
              }}
              flexDir={{
                base: "column",
                md: "row",
              }}
              pt="4"
              grow
              label="Grantee"
              value={grant.grantee}
              truncate
            />
            <DataListItem
              alignItems={{
                base: "flex-start",
                md: "center",
              }}
              flexDir={{
                base: "column",
                md: "row",
              }}
              pt="4"
              grow
              label="Locked until"
              value={grant.lockedUntil}
            />
          </DataListRoot>
          <Button
            alignSelf={{
              md: "flex-end",
            }}
            onClick={() => {
              handleCredentialsDetails(grant.dataId);
            }}
          >
            Credential details
          </Button>
        </Stack>
      ))}
      <SecretKeyPrompt
        {...{ open: openSecretKeyPrompt, toggle: toggleSecretKeyPrompt, onSubmit: onKeySubmit }}
      />

      <CredentialDetails
        {...{
          credentialId,
          open: !!secretKey && !!credentialId,
          secretKey,
          toggle: () => {
            toggleCredentialDetails();
            setCredentialId(""); // reset credentialId at closing
          },
        }}
      />
    </>
  );
}
