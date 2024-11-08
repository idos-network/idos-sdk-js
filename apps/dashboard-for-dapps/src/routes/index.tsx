import { Center, Container, Spinner, Stack, Text } from "@chakra-ui/react";
import {
  Button,
  DataListItem,
  DataListRoot,
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  EmptyState,
  Field,
  PasswordInput,
  SearchField,
} from "@idos-network/ui-kit";
import { skipToken, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useDebounce, useToggle } from "@uidotdev/usehooks";
import { matchSorter } from "match-sorter";
import { useAccount } from "wagmi";

import { useIdOS } from "@/idOS.provider";
import { useMemo, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  component: Index,
  validateSearch: (search): { filter?: string } => {
    return {
      filter: (search.filter as string) ?? undefined,
    };
  },
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

const useFetchCredential = (id: string) => {
  const idOS = useIdOS();
  return useQuery({
    queryKey: ["credential-details", id],
    queryFn: id ? () => idOS.data.getShared("credentials", id, false) : skipToken,
  });
};

function SecretKeyPrompt({
  open,
  toggle,
}: {
  open: boolean;
  toggle: (value?: boolean) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <DialogRoot
      open={open}
      placement="center"
      onOpenChange={() => {
        toggle(false);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter your secret key</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Stack gap="4">
            <Field label="Secret key:">
              <PasswordInput ref={ref} />
            </Field>
          </Stack>
        </DialogBody>
        <DialogFooter>
          <DialogActionTrigger asChild>
            <Button variant="outline">Cancel</Button>
          </DialogActionTrigger>
          <Button>Save</Button>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  );
}

function SearchResults({ results }: { results: GrantsWithFormattedLockedUntil }) {
  const [id, setId] = useState("");
  const [open, toggle] = useToggle();

  const credential = useFetchCredential(id);

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
            onClick={() => {
              setId(grant.dataId);
              toggle();
            }}
          >
            Credential details
          </Button>
        </Stack>
      ))}
      <SecretKeyPrompt {...{ open, toggle }} />
    </>
  );
}

function Index() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { filter = "" } = Route.useSearch();
  const debouncedSearchTerm = useDebounce(filter, 300);
  const grants = useFetchGrants();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const search = e.target.value;
    navigate({
      search: {
        filter: search,
      },
    });
  };

  const results = useMemo(() => {
    if (!grants.data) return [];
    if (!debouncedSearchTerm) return grants.data;

    return matchSorter(grants.data, debouncedSearchTerm, {
      keys: ["dataId", "owner", "grantee", "lockedUntil"],
    });
  }, [debouncedSearchTerm, grants.data]);

  return (
    <Container h="100%">
      <Stack gap="4" h="100%">
        {grants.isFetching ? (
          <Center h="100%" flexDirection="column" gap="2">
            <Spinner />
            <Text>Fetching grants...</Text>
          </Center>
        ) : (
          <Stack gap="4">
            <Stack
              flexDir={{
                base: "column",
                md: "row",
              }}
              gap="4"
              alignSelf={{ md: "flex-end" }}
              w={{
                base: "full",
                md: "md",
              }}
            >
              <SearchField
                value={filter}
                onChange={handleSearchChange}
                onClear={() =>
                  navigate({
                    search: {},
                  })
                }
              />
            </Stack>
            <SearchResults results={results} />
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
