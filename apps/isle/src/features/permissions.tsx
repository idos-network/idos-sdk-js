import {
  Center,
  Circle,
  Flex,
  HStack,
  Heading,
  Icon,
  IconButton,
  Image,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { LuCheck, LuChevronRight } from "react-icons/lu";

import { AuthorizedIcon } from "@/components/icons/authorized";
import { DeleteIcon } from "@/components/icons/delete";
import { ViewIcon } from "@/components/icons/view";
import { BreadcrumbLink, BreadcrumbRoot, Button } from "@/components/ui";
import { useIsleStore } from "@/store";
import type { idOSCredential } from "@idos-network/core";
import { RequestPermission } from "./request-permission";

interface GrantRevocationProps {
  grant: AccessGrantWithConsumer;
  onSuccess: () => void;
  onDismiss: () => void;
}

export function timelockToMs(timelock: number): number {
  return timelock * 1000;
}

function timelockToDate(timelock: number): string {
  const milliseconds = timelockToMs(timelock);

  return new Intl.DateTimeFormat(["ban", "id"], {
    dateStyle: "short",
    timeStyle: "short",
    hour12: true,
  }).format(new Date(milliseconds));
}

function GrantRevocation({ grant, onDismiss, onSuccess }: GrantRevocationProps) {
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const node = useIsleStore((state) => state.node);
  const hasRequestedRef = useRef(false);
  const hasTimeLock = grant.lockedUntil && grant.lockedUntil * 1000 > Date.now();

  useEffect(() => {
    if (!node || hasRequestedRef.current) return;

    // Mark that we've made the request
    hasRequestedRef.current = true;

    node?.on("update-revoke-access-grant-status", ({ status }) => {
      setStatus(status);

      if (status === "success") {
        setTimeout(() => {
          onSuccess();
          setStatus("idle");
        }, 5_000);
      }
    });
  }, [node, onSuccess]);

  if (status === "pending") {
    return (
      <Center flexDir="column" gap="6">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (status === "success") {
    return (
      <Center flexDir="column" gap="6">
        <Heading fontSize="lg" fontWeight="semibold" textAlign="center">
          Permission revoked.
        </Heading>
        <Circle
          size="12"
          bg={{
            _dark: "aquamarine.950",
            _light: "aquamarine.400",
          }}
          boxShadow="md"
        >
          <Icon
            color={{
              _dark: "aquamarine.600",
              _light: "aquamarine.700",
            }}
            as={LuCheck}
            w="6"
            h="6"
          />
        </Circle>
      </Center>
    );
  }

  if (status === "error") {
    return (
      <Center flexDirection="column" gap="6">
        <Heading h="2" fontSize="lg" textAlign="center" fontWeight="semibold" mb="3">
          Error while revoking permission.
        </Heading>
        <Text
          color="neutral.500"
          fontWeight="medium"
          fontSize="sm"
          maxW="250px"
          mx="auto"
          textAlign="center"
        >
          Unexpected error occurred while revoking permission.
        </Text>
        <Button
          w="full"
          onClick={() => {
            node?.post("revoke-permission", {
              id: grant.dataId,
            });
          }}
        >
          Try again
        </Button>
      </Center>
    );
  }

  return (
    <Stack gap="6">
      <Text textAlign="center" fontSize="lg" fontWeight="semibold">
        Are you sure you want to revoke access to this data?
      </Text>
      <HStack alignItems="center" gap="2.5" justifyContent="center">
        <Image
          src={grant.consumer.meta.logo}
          alt={grant.consumer.meta.name}
          rounded="full"
          w="30px"
          h="30px"
          shadow="md"
        />
        <Text fontWeight="semibold" color={{ _dark: "neutral.50", _light: "neutral.950" }} truncate>
          {grant.consumer.meta.name}
        </Text>
        <Icon
          as={LuChevronRight}
          fontSize="2xl"
          color={{ _dark: "neutral.50", _light: "neutral.950" }}
        />

        <Text fontSize="sm">{grant.type}</Text>
      </HStack>
      <Stack gap="3">
        <Flex w="full" gap="2">
          <Button
            flex="1"
            color={{ _dark: "aquamarine.400", _light: "aquamarine.800" }}
            bg={{ _dark: "aquamarine.400/30", _light: "aquamarine.200" }}
            onClick={onDismiss}
          >
            Cancel
          </Button>
          <Button
            disabled={!!hasTimeLock}
            flex="1"
            onClick={() => {
              node?.post("revoke-permission", {
                id: grant.dataId,
              });
            }}
          >
            Revoke
          </Button>
        </Flex>
        {hasTimeLock ? (
          <Text fontSize="xs" color="neutral.500" textAlign="center">
            This grant is locked until {timelockToDate(grant.lockedUntil)} and cannot be revoked
            until then.
          </Text>
        ) : null}
      </Stack>
    </Stack>
  );
}

function Breadcrumbs({ goHome }: { goHome: () => void }) {
  return (
    <BreadcrumbRoot
      size="lg"
      separator={
        <Icon
          fontSize="2xl"
          color={{ _dark: "neutral.50", _light: "neutral.950" }}
          as={LuChevronRight}
        />
      }
    >
      <BreadcrumbLink
        fontSize="sm"
        fontWeight="medium"
        cursor="pointer"
        color={{
          _dark: "neutral.50",
          _light: "neutral.950",
        }}
        onClick={goHome}
      >
        Permissions
      </BreadcrumbLink>
      <BreadcrumbLink
        fontSize="sm"
        fontWeight="medium"
        cursor="pointer"
        color={{
          _dark: "neutral.50",
          _light: "neutral.950",
        }}
      >
        KYC Data
      </BreadcrumbLink>
    </BreadcrumbRoot>
  );
}

function CredentialDetails({ goHome, onRevoke }: { goHome: () => void; onRevoke: () => void }) {
  const node = useIsleStore((state) => state.node);
  const [credential, setCredential] = useState<idOSCredential | null>(null);
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");

  useEffect(() => {
    if (!node) return;
    node.on("update-view-credential-details-status", (data) => {
      setStatus(data.status);
      if (data.status === "success") {
        setCredential(data.credential ?? null);
      }
    });
  }, [node]);

  if (status === "pending") {
    return (
      <Center flexDir="column" gap="6">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (status === "error") {
    return (
      <Center flexDir="column" gap="6">
        <Heading fontSize="lg" fontWeight="semibold" textAlign="center">
          Error while viewing credential details.
        </Heading>
      </Center>
    );
  }

  if (status === "success") {
    return (
      <Stack gap="6" w="full" maxW="full" overflow="auto">
        <Breadcrumbs goHome={goHome} />
        <Stack gap="3">
          <Flex justifyContent="space-between">
            <Flex alignItems="center" gap="2.5">
              <Image />
              <Text fontWeight="semibold" color={{ _dark: "neutral.50", _light: "neutral.950" }}>
                Common
              </Text>
            </Flex>
            <AuthorizedIcon color="aquamarine.400" />
          </Flex>
          <Flex maxW="324px" maxH="340px" overflow="auto">
            <CredentialContent content={credential?.content} />
          </Flex>
        </Stack>
        <Button onClick={onRevoke}>
          Revoke Access
          <Icon w={5} h={5} color="neutral.950">
            <DeleteIcon />
          </Icon>
        </Button>
      </Stack>
    );
  }
}

function safeParse(json?: string) {
  try {
    return JSON.parse(json ?? "{}");
  } catch (error) {
    return {};
  }
}

const addressListRender = (value: { address: string }[]) => {
  return (
    <Stack>
      {value.map((item) => (
        <Flex key={item.address}>
          <Text>{item.address}</Text>
        </Flex>
      ))}
    </Stack>
  );
};

const defaultRender = (value: string) => value;

const infoRenderMap = {
  emails: addressListRender,
  wallets: addressListRender,
  issuanceDate: (value: string) => {
    return new Date(value).toLocaleDateString();
  },
  approved_at: (value: string) => {
    return new Date(value).toLocaleDateString();
  },
} as const;

function CredentialContent({ content: credentialContent }: { content: string | undefined }) {
  const parsedContent: Record<string, string> = credentialContent
    ? safeParse(credentialContent)
    : {};
  const hasValidContent = parsedContent?.credentialSubject;
  const { credentialSubject } = hasValidContent
    ? safeParse(credentialContent)
    : { credentialSubject: {} };
  const hiddenFields = ["@context", "type", "credentialSubject", "proof"];

  const contentToRender = {
    ...parsedContent,
    ...credentialSubject,
  };

  return (
    <Stack
      bg={{ _dark: "neutral.800", _light: "neutral.200" }}
      borderRadius="xl"
      gap="0"
      w="full"
      maxW="full"
      overflow="auto"
    >
      {Object.entries(contentToRender || {})
        .filter(([key]) => !hiddenFields.includes(key))
        .map(([key, value], index) => (
          <Flex
            key={key}
            py="3.5"
            px="4"
            gap="5"
            borderColor={{ _dark: "neutral.700", _light: "neutral.300" }}
            borderBottomWidth={index === Object.keys(contentToRender || {}).length - 1 ? 0 : 1}
            borderStyle="solid"
          >
            <Text
              flex="1"
              fontSize="xs"
              fontWeight="medium"
              color={{ _dark: "neutral.50", _light: "neutral.950" }}
            >
              {key}
            </Text>
            <Text
              whiteSpace="pre"
              flex="1"
              fontSize="xs"
              fontWeight="medium"
              color={{ _dark: "neutral.50", _light: "neutral.950" }}
              truncate
            >
              {/* biome-ignore lint/suspicious/noExplicitAny: Will be fixed later */}
              {infoRenderMap?.[key as keyof typeof infoRenderMap]?.(value as unknown as any) ??
                // biome-ignore lint/suspicious/noExplicitAny: Will be fixed later
                defaultRender(value as unknown as any)}
            </Text>
          </Flex>
        ))}
    </Stack>
  );
}

interface ConsumerInfo {
  consumerPublicKey: string;
  meta: {
    url: string;
    name: string;
    logo: string;
  };
}
interface AccessGrantWithConsumer {
  id: string;
  dataId: string;
  type: string;
  consumer: ConsumerInfo;
  mode: "view" | "revoke";
  lockedUntil: number;
  originalCredentialId: string;
}

export function Permissions() {
  const accessGrants = useIsleStore((state) => state.accessGrants);
  const [grant, setGrant] = useState<AccessGrantWithConsumer | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<
    "idle" | "request-permission" | "pending" | "success" | "error"
  >("idle");
  const [consumer, setConsumer] = useState<ConsumerInfo | null>(null);
  const [kycPermissions, setRequestedPermissions] = useState<string[]>([]);
  const node = useIsleStore((state) => state.node);
  const hasRequestedRef = useRef(false);

  useEffect(() => {
    if (!node || hasRequestedRef.current) return;

    // Mark that we've made the request
    hasRequestedRef.current = true;

    node.on("update-request-access-grant-status", (data) => {
      setPermissionStatus(data.status);
      if (data.status === "request-permission") {
        setRequestedPermissions(data.KYCPermissions);
        setConsumer(data.consumer);
      }
      if (data.status === "success") {
        setTimeout(() => {
          setPermissionStatus("idle");
        }, 5_000);
      }
    });
  }, [node]);

  const grants = useMemo(() => {
    return Array.from(accessGrants?.entries() ?? []);
  }, [accessGrants]);

  if (grant?.mode === "view") {
    return (
      <CredentialDetails
        onRevoke={() => setGrant({ ...grant, mode: "revoke" })}
        goHome={() => setGrant(null)}
      />
    );
  }
  if (grant?.mode === "revoke") {
    return (
      <GrantRevocation
        grant={grant}
        onSuccess={() => setGrant(null)}
        onDismiss={() => setGrant(null)}
      />
    );
  }

  if (permissionStatus === "request-permission" && consumer && kycPermissions) {
    return <RequestPermission consumer={consumer.meta} permissions={kycPermissions} />;
  }

  if (permissionStatus === "pending") {
    return (
      <Center flexDir="column" gap="6">
        <Heading fontSize="lg" fontWeight="semibold" textAlign="center">
          Granting access
        </Heading>
        <Spinner size="xl" />
      </Center>
    );
  }

  if (permissionStatus === "error") {
    return (
      <Center flexDirection="column" gap="6">
        <Heading h="2" fontSize="lg" textAlign="center" fontWeight="semibold" mb="3">
          Error while requesting permissions.
        </Heading>
        <Text
          color="neutral.500"
          fontWeight="medium"
          fontSize="sm"
          maxW="250px"
          mx="auto"
          textAlign="center"
        >
          An unexpected error occurred while requesting permissions.
        </Text>
      </Center>
    );
  }

  if (permissionStatus === "success") {
    return (
      <Center flexDir="column" gap="6">
        <Heading fontSize="lg" fontWeight="semibold" textAlign="center">
          Access Granted.
        </Heading>
        <Circle
          size="12"
          bg={{
            _dark: "aquamarine.950",
            _light: "aquamarine.400",
          }}
          boxShadow="md"
        >
          <Icon
            color={{
              _dark: "aquamarine.600",
              _light: "aquamarine.700",
            }}
            as={LuCheck}
            w="6"
            h="6"
          />
        </Circle>
      </Center>
    );
  }

  return (
    <Stack>
      <Stack gap="6">
        {grants.map(([consumer, values]) => (
          <Stack key={consumer.consumerPublicKey} gap="3">
            <HStack justifyContent="space-between" alignItems="center">
              <HStack gap="2.5">
                <Image
                  src={consumer.meta.logo}
                  alt={consumer.meta.name}
                  rounded="full"
                  w="30px"
                  h="30px"
                  shadow="md"
                />
                <Heading
                  as="h3"
                  fontWeight="semibold"
                  fontSize="lg"
                  color={{ _dark: "neutral.50", _light: "neutral.950" }}
                >
                  {consumer.meta.name}
                </Heading>
              </HStack>
              <AuthorizedIcon color={values.length > 0 ? "aquamarine.400" : "neutral.400"} />
            </HStack>
            <Stack>
              {values.length === 0 ? (
                <HStack
                  bg={{ _dark: "neutral.800", _light: "neutral.200" }}
                  borderRadius="xl"
                  px={4}
                  h="56px"
                >
                  <Text fontSize="sm" color="neutral.500">
                    No Permissions
                  </Text>
                </HStack>
              ) : (
                values.map((grant) => (
                  <HStack
                    key={grant.id}
                    justifyContent="space-between"
                    bg={{ _dark: "neutral.800", _light: "neutral.200" }}
                    borderRadius="xl"
                    px={4}
                    h="56px"
                  >
                    <Text key={grant.id}>{grant.type}</Text>
                    <HStack gap="2">
                      <IconButton
                        aria-label="View"
                        variant="ghost"
                        size="xs"
                        colorPalette="green"
                        rounded="full"
                        onClick={() => {
                          setGrant({
                            consumer,
                            ...grant,
                            mode: "view",
                          });
                          node?.post("view-credential-details", {
                            id: grant.originalCredentialId,
                          });
                        }}
                      >
                        <ViewIcon w="5" h="5" color="neutral.400" />
                      </IconButton>

                      <IconButton
                        aria-label="Revoke"
                        variant="ghost"
                        size="xs"
                        colorPalette="green"
                        rounded="full"
                        onClick={() => {
                          setGrant({
                            consumer,
                            ...grant,
                            mode: "revoke",
                          });
                        }}
                      >
                        <DeleteIcon w="5" h="5" color="neutral.400" />
                      </IconButton>
                    </HStack>
                  </HStack>
                ))
              )}
            </Stack>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
