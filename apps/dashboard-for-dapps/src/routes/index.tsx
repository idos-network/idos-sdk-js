import { Center, Container, Spinner, Stack, Text } from "@chakra-ui/react";
import { Button, DataListItem, DataListRoot, EmptyState } from "@idos-network/ui-kit";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useAccount } from "wagmi";

import { useIdOS } from "@/idOS.provider";

export const Route = createFileRoute("/")({
  component: Index,
});

const useFetchGrants = () => {
  const idOS = useIdOS();
  const { address } = useAccount();

  return useQuery({
    queryKey: ["grants"],
    queryFn: () =>
      idOS.grants.list({
        grantee: address,
      }),
    select: (data) =>
      data.map((grant) => ({
        ...grant,
        lockedUntil:
          grant.lockedUntil === 0
            ? "Unlocked"
            : Intl.DateTimeFormat("en-US", {
                dateStyle: "full",
                timeStyle: "short",
              }).format(grant.lockedUntil * 1000),
      })),
  });
};

type GrantsWithFormattedLockedUntil = NonNullable<ReturnType<typeof useFetchGrants>["data"]>;

function SearchResults({ results }: { results: GrantsWithFormattedLockedUntil }) {
  if (!results.length) {
    return <EmptyState title="No results found" bg="gray.900" rounded="lg" />;
  }

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
          >
            Credential details
          </Button>
        </Stack>
      ))}
    </>
  );
}

function Index() {
  const grants = useFetchGrants();

  return (
    <Container h="100%">
      <Stack gap="4" h="100%">
        {grants.isFetching ? (
          <Center h="100%" flexDirection="column" gap="2">
            <Spinner />
            <Text>Fetching grants...</Text>
          </Center>
        ) : (
          <SearchResults results={grants.data ?? []} />
        )}
      </Stack>
    </Container>
  );
}
