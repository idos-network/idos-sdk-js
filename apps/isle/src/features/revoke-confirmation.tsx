import { Button } from "@/components/ui";
import { Center, Circle, Flex, Heading, Icon, Spinner, Stack, Text } from "@chakra-ui/react";
import { useState } from "react";
import { LuCheck, LuChevronLeft } from "react-icons/lu";
import {
  type Permission,
  Circle as PermissionCircle,
  deletionStyle,
  themedColor,
} from "./permissions";

const RevokedPermission = ({ permission }: { permission: Permission }) => {
  return (
    <Flex alignItems="center" gap="2.5" justifyContent="center">
      <PermissionCircle icon={permission.icon} />
      <Text fontWeight="semibold" color={{ _dark: "neutral.50", _light: "neutral.950" }}>
        {permission.name}
      </Text>
      <Icon fontSize="2xl" color={themedColor}>
        <LuChevronLeft />
      </Icon>
      <Text fontSize="sm">KYC Data</Text>
    </Flex>
  );
};

const Revoking = () => {
  return (
    <Flex alignItems="center" gap="2.5" justifyContent="center">
      <Spinner size="xl" />
      <Text fontSize="sm">Revoking...</Text>
    </Flex>
  );
};

const Revoked = () => {
  return (
    <Center flexDirection="column" gap="6">
      <Heading h="2" fontSize="lg" textAlign="center" fontWeight="semibold" mb="3">
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
        />
      </Circle>
    </Center>
  );
};

export const RevokeConfirmation = ({
  onCancel,
  permission,
  onSuccess,
}: { onCancel: () => void; permission: Permission; onSuccess: () => void }) => {
  const [isRevoking, setIsRevoking] = useState(false);
  const [isRevoked, setIsRevoked] = useState(false);

  const mockRevoking = async () => {
    setIsRevoking(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsRevoking(false);
    setIsRevoked(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    onSuccess();
  };

  if (isRevoking) {
    return <Revoking />;
  }

  if (isRevoked) {
    return <Revoked />;
  }

  return (
    <Stack gap="6">
      <Text textAlign="center" fontSize="lg" fontWeight="semibold">
        Are you sure you want to revoke access to this data?
      </Text>
      <RevokedPermission permission={permission} />
      <Stack gap="3">
        <Flex w="full" gap="2">
          <Button onClick={onCancel} flex={1} {...deletionStyle}>
            Cancel
          </Button>
          <Button onClick={mockRevoking} flex={1}>
            Revoke
          </Button>
        </Flex>
        <Text textAlign="left" fontSize="xs" color="neutral.500">
          On timelocked AGs, show the End-Date of the Timelock and prevent to revoke access.
        </Text>
      </Stack>
    </Stack>
  );
};
