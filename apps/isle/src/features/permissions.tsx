import { Flex, HStack, Heading, Icon, IconButton, Image, Stack, Text } from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { LuChevronRight } from "react-icons/lu";

import { AuthorizedIcon } from "@/components/icons/authorized";
import { DeleteIcon } from "@/components/icons/delete";
import { ViewIcon } from "@/components/icons/view";
import { BreadcrumbLink, BreadcrumbRoot, Button } from "@/components/ui";
import { useIsleStore } from "@/store";

// @todo: On timelocked AGs, show the End-Date of the Timelock and prevent to revoke access
function GrantRevocation({
  grant,
  onCancel,
  onRevoke,
}: { grant: AccessGrant; onCancel: () => void; onRevoke: () => void }) {
  return (
    <Stack gap="6">
      <Text textAlign="center" fontSize="lg" fontWeight="semibold">
        Are you sure you want to revoke access to this data?
      </Text>
      <HStack alignItems="center" gap="2.5" justifyContent="center">
        <Image
          src={grant.grantee.logo}
          alt={grant.grantee.name}
          rounded="full"
          w="30px"
          h="30px"
          shadow="md"
        />
        <Text fontWeight="semibold" color={{ _dark: "neutral.50", _light: "neutral.950" }}>
          {grant.grantee.name}
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
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button flex="1" onClick={onRevoke}>
            Revoke
          </Button>
        </Flex>
      </Stack>
    </Stack>
  );
}

function Breadcrumbs() {
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

function CredentialDetails() {
  return (
    <Stack gap="6">
      <Breadcrumbs />
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
        <CredentialContent />
      </Stack>
      <Button>
        Revoke Access
        <Icon w={5} h={5} color="neutral.950">
          <DeleteIcon />
        </Icon>
      </Button>
    </Stack>
  );
}

function CredentialContent() {
  return (
    <Stack bg={{ _dark: "neutral.800", _light: "neutral.200" }} borderRadius="xl" gap="0">
      {Object.entries({}).map(([key, value], index) => (
        <Flex
          key={key}
          py="3.5"
          px="4"
          borderColor={{ _dark: "neutral.700", _light: "neutral.300" }}
          borderBottomWidth={index === Object.keys({}).length - 1 ? 0 : 1}
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
            flex="1"
            fontSize="sm"
            fontWeight="medium"
            color={{ _dark: "neutral.50", _light: "neutral.950" }}
          />
        </Flex>
      ))}
    </Stack>
  );
}

interface GranteeInfo {
  name: string;
  logo: string;
}
interface AccessGrant {
  id: string;
  type: string;
  grantee: GranteeInfo;
}

export function Permissions() {
  const accessGrants = useIsleStore((state) => state.accessGrants);
  const [grantToRevoke, setGrantToRevoke] = useState<AccessGrant | null>(null);

  const grants = useMemo(() => {
    return Array.from(accessGrants?.entries() ?? []);
  }, [accessGrants]);

  if (grantToRevoke) {
    return (
      <GrantRevocation
        grant={grantToRevoke}
        onCancel={() => setGrantToRevoke(null)}
        onRevoke={() => {}}
      />
    );
  }

  return (
    <Stack>
      <Stack gap="6">
        {grants.map(([key, value]) => (
          <Stack key={key.name} gap="3">
            <HStack justifyContent="space-between" alignItems="center">
              <HStack gap="2.5">
                <Image src={key.logo} alt={key.name} rounded="full" w="30px" h="30px" shadow="md" />
                <Heading
                  as="h3"
                  fontWeight="semibold"
                  fontSize="lg"
                  color={{ _dark: "neutral.50", _light: "neutral.950" }}
                >
                  {key.name}
                </Heading>
              </HStack>
              <AuthorizedIcon color={value.length > 0 ? "aquamarine.400" : "neutral.400"} />
            </HStack>
            <Stack>
              {value.length === 0 ? (
                <HStack
                  bg={{ _dark: "neutral.800", _light: "neutral.200" }}
                  borderRadius="xl"
                  p={4}
                >
                  <Text fontSize="sm" color="neutral.500">
                    No Permissions
                  </Text>
                </HStack>
              ) : (
                value.map((grant) => (
                  <HStack
                    key={grant.id}
                    justifyContent="space-between"
                    bg={{ _dark: "neutral.800", _light: "neutral.200" }}
                    borderRadius="xl"
                    p={4}
                  >
                    <Text key={grant.id}>{grant.type}</Text>
                    <HStack gap="2">
                      <IconButton
                        aria-label="View"
                        variant="ghost"
                        size="xs"
                        colorPalette="green"
                        rounded="full"
                        onClick={() => {}}
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
                          setGrantToRevoke({
                            id: grant.id,
                            type: grant.type,
                            grantee: key,
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
        <Button
          color={{ _dark: "aquamarine.400", _light: "aquamarine.800" }}
          bg={{ _dark: "aquamarine.400/30", _light: "aquamarine.200" }}
        >
          Disconnect
        </Button>
      </Stack>
    </Stack>
  );
}
