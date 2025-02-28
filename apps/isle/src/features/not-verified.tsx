import {
  Center,
  Circle,
  Flex,
  HStack,
  Heading,
  Image,
  Spinner,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { LuCheck } from "react-icons/lu";

import { Icon } from "@/components/icons/icon";
import { IdentityIcon } from "@/components/icons/identity";
import { KeyIcon } from "@/components/icons/key";
import { Button, Stepper } from "@/components/ui";
import { useIsleStore } from "@/store";

function Disclaimer({ name }: { name: string }) {
  return (
    <Flex
      gap="2"
      bg={{ _dark: "neutral.800", _light: "neutral.200" }}
      p="4"
      borderRadius="3xl"
      alignItems="center"
    >
      <Text fontSize="xs" color="neutral.500">
        Make sure you trust{" "}
        <Text as="span" color="neutral.400" fontWeight="semibold">
          {name}
        </Text>
        , as you may be sharing sensitive data with this site or app.
      </Text>
    </Flex>
  );
}

function KYCInfo({ values }: { values: string[] }) {
  return (
    <Stack gap="2">
      <Stack gap="1">
        {values.map((value) => (
          <Text key={value} fontSize="xs" color="neutral.500">
            {value}
          </Text>
        ))}
      </Stack>
    </Stack>
  );
}

function RequestedPermissions() {
  return (
    <Stack bg={{ _dark: "neutral.800", _light: "neutral.200" }} p="4" borderRadius="3xl">
      <VStack gap="2" alignItems="stretch">
        <HStack gap="2.5" alignItems="center">
          <KeyIcon w="4" h="4" />
          <Text fontSize="sm" fontWeight="medium">
            Add one credential to your idOS Profile
          </Text>
        </HStack>
        <HStack gap="2.5" alignItems="center">
          <IdentityIcon w="5" h="5" />
          <Text fontSize="sm" fontWeight="medium">
            Grant access to your KYC data like:
          </Text>
        </HStack>
        <KYCInfo
          values={[
            "Name and last name",
            "Gender",
            "Country and city of residence",
            "Place and date of birth",
            "ID Document",
            "Liveness check (No pictures)",
          ]}
        />
      </VStack>
    </Stack>
  );
}

// @todo: Image, title and permissions should be consumed from the store or config
function Header({ name }: { name: string }) {
  return (
    <Flex gap="2.5" alignItems="center">
      <Circle size="30px" bg="white">
        <Image src="/common.svg" />
      </Circle>
      <Text gap="1" alignItems="baseline" display="flex">
        <Text as="span" fontWeight="medium" fontSize="lg">
          {name}
        </Text>
        <Text as="span" fontSize="sm">
          is asking for permissions to:
        </Text>
      </Text>
    </Flex>
  );
}

export function NotVerified() {
  const node = useIsleStore((state) => state.node);
  const [status, setStatus] = useState<
    "idle" | "pending" | "success" | "start-verification" | "verify-identity" | "error"
  >("idle");
  const hasRequestedRef = useRef(false);

  useEffect(() => {
    if (!node || hasRequestedRef.current) return;

    // Mark that we've made the request
    hasRequestedRef.current = true;

    // Set up the event listener
    node.on("update-create-dwg-status", ({ status }) => {
      setStatus(status);
      if (status === "success") {
        setTimeout(() => {
          setStatus("verify-identity");
        }, 2000);
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
        <Header name="Common" />
        <Stack gap="2">
          <RequestedPermissions />
          <Disclaimer name="Common" />
        </Stack>
      </Stack>
    </Stack>
  );
}
