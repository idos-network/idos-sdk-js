import { AuthorizedIcon } from "@/components/icons/authorized";
import { DeleteIcon } from "@/components/icons/delete";
import { ViewIcon } from "@/components/icons/view";
import { BreadcrumbLink, BreadcrumbRoot } from "@/components/ui/breadcrumb";
import { DisconnectButton } from "@/components/ui/disconnect";
import { Flex, Image, Stack, Text } from "@chakra-ui/react";
import { useState } from "react";

const mockKycData = {
  gender: "Female",
  firstName: "John",
  lastName: "Doe",
  dataOfBirth: "1990-01-01",
  placeOfBirth: "New York, NY",
  countryOfResidence: "United States",
  city: "Anytown",
};

interface Permission {
  name: string;
  hasGrant: boolean;
  icon: string;
}

function PermissionHeader({ name, icon, hasGrant }: Permission) {
  return (
    <Flex justifyContent="space-between">
      <Flex alignItems="center" gap={2.5}>
        <Flex
          alignItems="center"
          justifyContent="center"
          gap={2}
          bg="white"
          w="30px"
          h="30px"
          borderRadius="full"
          shadow="md"
        >
          <Image src={icon} />
        </Flex>
        <Text fontWeight="semibold" color={{ _dark: "neutral.50", _light: "neutral.950" }}>
          {name}
        </Text>
      </Flex>
      <AuthorizedIcon color={hasGrant ? "aquamarine.400" : "neutral.400"} />
    </Flex>
  );
}

function KYCData() {
  return (
    <Stack bg={{ _dark: "neutral.800", _light: "neutral.200" }} borderRadius="xl" gap={0}>
      {Object.entries(mockKycData).map(([key, value], index) => (
        <Flex
          key={key}
          py={3.5}
          px={4}
          borderColor={{ _dark: "neutral.700", _light: "neutral.300" }}
          borderBottomWidth={index === Object.keys(mockKycData).length - 1 ? 0 : 1}
          borderStyle="solid"
        >
          <Text
            flex={1}
            fontSize="xs"
            fontWeight="medium"
            color={{ _dark: "neutral.50", _light: "neutral.950" }}
          >
            {key}
          </Text>
          <Text
            flex={1}
            fontSize="sm"
            fontWeight="medium"
            color={{ _dark: "neutral.50", _light: "neutral.950" }}
          >
            {value}
          </Text>
        </Flex>
      ))}
    </Stack>
  );
}

function PermissionView({ name, icon, hasGrant, onClick }: PermissionProps) {
  return (
    <Stack>
      <BreadcrumbRoot size="lg">
        <BreadcrumbLink fontWeight="medium" cursor="pointer" onClick={onClick}>
          Permissions
        </BreadcrumbLink>
        <BreadcrumbLink fontWeight="medium" cursor="pointer">
          KYC Data
        </BreadcrumbLink>
      </BreadcrumbRoot>

      <Stack gap={4} mt={6}>
        <PermissionHeader name={name} icon={icon} hasGrant={hasGrant} />
        <KYCData />
      </Stack>
    </Stack>
  );
}

interface PermissionProps extends Permission {
  onClick: () => void;
}

function Permission({ hasGrant, name, icon, onClick }: PermissionProps) {
  return (
    <Stack>
      <PermissionHeader name={name} icon={icon} hasGrant={hasGrant} />
      <Flex
        bg={{ _dark: "neutral.800", _light: "neutral.200" }}
        borderRadius="xl"
        p={4}
        justifyContent="space-between"
      >
        {hasGrant ? (
          <Text
            fontWeight="medium"
            fontSize="sm"
            color={{ _dark: "neutral.50", _light: "neutral.950" }}
          >
            KYC Data
          </Text>
        ) : (
          <Text fontWeight="medium" fontSize="sm" color="neutral.500">
            No Permissions
          </Text>
        )}
        {hasGrant && (
          <Flex gap={2}>
            <ViewIcon w={5} h={5} cursor="pointer" onClick={onClick} />
            <DeleteIcon w={5} h={5} cursor="pointer" />
          </Flex>
        )}
      </Flex>
    </Stack>
  );
}

export function Permissions() {
  const [permission, setPermission] = useState<Permission | null>(null);
  const permissionList = [
    {
      name: "Common",
      hasGrant: true,
      icon: "/common.svg",
    },
    {
      name: "Holyheld",
      hasGrant: false,
      icon: "/holyheld.svg",
    },
  ];

  if (permission) {
    return <PermissionView onClick={() => setPermission(null)} {...permission} />;
  }

  return (
    <Stack>
      <Stack gap={6}>
        {permissionList.map((permission) => (
          <Permission
            key={permission.name}
            {...permission}
            onClick={() => setPermission(permission)}
          />
        ))}
      </Stack>
      <Flex mt={6} justifyContent="center">
        <DisconnectButton />
      </Flex>
    </Stack>
  );
}
