import { type BreadcrumbLinkProps, Flex, Icon, Image, Stack, Text } from "@chakra-ui/react";
import { useState } from "react";
import { LuChevronLeft } from "react-icons/lu";
import { useDisconnect } from "wagmi";

import { AuthorizedIcon } from "@/components/icons/authorized";
import { DeleteIcon } from "@/components/icons/delete";
import { ViewIcon } from "@/components/icons/view";
import { BreadcrumbLink, BreadcrumbRoot } from "@/components/ui";
import { Button } from "@/components/ui";

const mockKycData = {
  gender: "Female",
  firstName: "John",
  lastName: "Doe",
  dataOfBirth: "1990-01-01",
  placeOfBirth: "New York, NY",
  countryOfResidence: "United States",
  city: "Texas",
};

interface Permission {
  name: string;
  hasGrant: boolean;
  icon: string;
}

interface PermissionProps extends Permission {
  onClick: () => void;
}

const themedColor = {
  _dark: "neutral.50",
  _light: "neutral.950",
};

export function DisconnectButton() {
  const { disconnect, isPending } = useDisconnect();
  return (
    <Button
      color={{ _dark: "aquamarine.400", _light: "aquamarine.800" }}
      bg={{ _dark: "aquamarine.400/30", _light: "aquamarine.200" }}
      onClick={() => disconnect()}
      loading={isPending}
    >
      Disconnect
    </Button>
  );
}

export function RevokeButton() {
  return (
    <Button>
      Revoke Access
      <Icon w={5} h={5} color="neutral.950">
        <DeleteIcon />
      </Icon>
    </Button>
  );
}

export function Circle({ icon }: { icon: string }) {
  return (
    <Flex
      alignItems="center"
      justifyContent="center"
      gap="2"
      bg="white"
      minW="30px"
      h="30px"
      borderRadius="full"
      shadow="md"
    >
      <Image src={icon} />
    </Flex>
  );
}

function PermissionHeader({ name, icon, hasGrant }: Permission) {
  return (
    <Flex justifyContent="space-between">
      <Flex alignItems="center" gap="2.5">
        <Circle icon={icon} />
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
    <Stack bg={{ _dark: "neutral.800", _light: "neutral.200" }} borderRadius="xl" gap="0">
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

const StyledBreadcrumbLink = ({ children, ...props }: BreadcrumbLinkProps) => {
  return (
    <BreadcrumbLink
      fontSize="sm"
      fontWeight="medium"
      cursor="pointer"
      color={themedColor}
      {...props}
    >
      {children}
    </BreadcrumbLink>
  );
};

const NavigationBreadcrumbs = ({ onClick }: { onClick: () => void }) => {
  return (
    <BreadcrumbRoot
      size="lg"
      separator={
        <Icon fontSize="2xl" color={themedColor}>
          <LuChevronLeft />
        </Icon>
      }
    >
      <StyledBreadcrumbLink onClick={onClick}>Permissions</StyledBreadcrumbLink>
      <StyledBreadcrumbLink>KYC Data</StyledBreadcrumbLink>
    </BreadcrumbRoot>
  );
};

function PermissionView({ name, icon, hasGrant, onClick }: PermissionProps) {
  return (
    <Stack gap="6">
      <NavigationBreadcrumbs onClick={onClick} />
      <Stack gap="3">
        <PermissionHeader name={name} icon={icon} hasGrant={hasGrant} />
        <KYCData />
      </Stack>
      <RevokeButton />
    </Stack>
  );
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
          <Flex gap="2">
            <Icon w="5" h="5" cursor="pointer" onClick={onClick} color="neutral.400">
              <ViewIcon />
            </Icon>
            <Icon w="5" h="5" cursor="pointer" color="neutral.400">
              <DeleteIcon />
            </Icon>
          </Flex>
        )}
      </Flex>
    </Stack>
  );
}

export function Permissions() {
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
  const [permission, setPermission] = useState<Permission | null>(null);

  if (permission) {
    return <PermissionView onClick={() => setPermission(null)} {...permission} />;
  }

  return (
    <Stack>
      <Stack gap="6">
        {permissionList.map((permission) => (
          <Permission
            key={permission.name}
            {...permission}
            onClick={() => setPermission(permission)}
          />
        ))}
      </Stack>
      <Flex mt="6" justifyContent="center">
        <DisconnectButton />
      </Flex>
    </Stack>
  );
}
