import {
  Box,
  Center,
  Circle,
  HStack,
  Heading,
  Spinner,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { LuCheck } from "react-icons/lu";

import { Disclaimer } from "@/components/disclaimer";
import { GranteeInfo } from "@/components/grantee-info";
import { Icon } from "@/components/icons/icon";
import { IdentityIcon } from "@/components/icons/identity";
import { KeyIcon } from "@/components/icons/key";
import { KYCInfo } from "@/components/kyc-info";
import { Button, Stepper } from "@/components/ui";
import { useIsleStore } from "@/store";

function RequestedPermissions({ values }: { values: string[] }) {
  return (
    <Stack bg={{ _dark: "neutral.800", _light: "neutral.200" }} p="4" borderRadius="3xl">
      <VStack gap="2" alignItems="stretch">
        <HStack gap="2.5" alignItems="center">
          <KeyIcon w="4" h="4" />
          <Text fontSize="sm" fontWeight="medium" pl="1">
            Add one credential to your idOS Profile
          </Text>
        </HStack>
        <HStack gap="2.5" alignItems="center">
          <IdentityIcon w="5" h="5" />
          <Text fontSize="sm" fontWeight="medium">
            Grant access to your KYC data like:
          </Text>
        </HStack>
        <Box pl="7">
          <KYCInfo values={values} />
        </Box>
      </VStack>
    </Stack>
  );
}

export function NotVerified() {
  const node = useIsleStore((state) => state.node);
  const [status, setStatus] = useState<
    "idle" | "pending" | "success" | "start-verification" | "verify-identity" | "error"
  >("idle");
  const hasRequestedRef = useRef(false);

  const [meta, setMeta] = useState<{
    url: string;
    name: string;
    logo: string;
    KYCPermissions: string[];
  } | null>(null);

  useEffect(() => {
    if (!node || hasRequestedRef.current) return;

    // Mark that we've made the request
    hasRequestedRef.current = true;

    // Set up the event listener
    node.on("update-create-dwg-status", (data) => {
      setStatus(data.status);

      if (data.status === "start-verification") {
        setMeta(data.meta);
      }

      if (data.status === "success") {
        setTimeout(() => {
          setStatus("verify-identity");
        }, 5_000);
      }
    });
  }, [node]);

  if (status === "idle") {
    return (
      <Center flexDir="column" gap="6">
        <Heading fontSize="lg" fontWeight="semibold" textAlign="center">
          You are not verified yet.
        </Heading>
        <Text color="neutral.500" fontSize="sm" textAlign="center">
          Please verify your identity to proceed.
        </Text>
      </Center>
    );
  }

  if (status === "pending") {
    return (
      <Center flexDir="column" gap="6">
        <Stepper stepsLength={3} index={1} />
        <Spinner size="xl" />
      </Center>
    );
  }

  if (status === "success") {
    return (
      <Center flexDir="column" gap="6">
        <Heading fontSize="lg" fontWeight="semibold" textAlign="center">
          Access Granted.
        </Heading>
        <Stepper stepsLength={3} index={1} />
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
          Error while requesting permissions.
        </Heading>
        <Stepper stepsLength={3} index={1} />
        <Text
          color="neutral.500"
          fontWeight="medium"
          fontSize="sm"
          maxW="250px"
          mx="auto"
          textAlign="center"
        >
          Unexpected error occurred while requesting permissions.
        </Text>
        <Button
          w="full"
          onClick={() => {
            node?.post("updated", {
              status: "not-verified",
            });
          }}
        >
          Try again
        </Button>
      </Center>
    );
  }

  if (status === "verify-identity") {
    return (
      <Center flexDir="column" gap="6">
        <Heading fontSize="lg" fontWeight="semibold" textAlign="center">
          Verify your identity
        </Heading>
        <Stepper stepsLength={3} index={1} />
        <Text color="neutral.500" fontSize="sm" textAlign="center">
          This application is asking you to verify your identity. You will now be led to a KYC
          journey to complete the process.
        </Text>
        <Button
          w="full"
          onClick={() => {
            node?.post("verify-identity", {});
          }}
        >
          Verify your identity
        </Button>
      </Center>
    );
  }

  return (
    <Stack gap="6">
      <Heading fontSize="lg" fontWeight="semibold" textAlign="center">
        Share access to your data
      </Heading>
      <Stepper stepsLength={3} index={1} />
      <Text color="neutral.500" fontSize="sm" textAlign="center" fontWeight="medium">
        To proceed, please confirm in your wallet.
      </Text>
      <Stack gap="4">
        <GranteeInfo name={meta?.name ?? ""} logo={meta?.logo ?? ""} />
        <Stack gap="2">
          <RequestedPermissions values={meta?.KYCPermissions ?? []} />
          <Disclaimer name={meta?.name ?? ""} logo={meta?.logo ?? ""} />
        </Stack>
      </Stack>
    </Stack>
  );
}
