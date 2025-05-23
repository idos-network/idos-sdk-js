import { Center, Circle, Heading, Spinner, Text } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { LuCheck } from "react-icons/lu";

import { Icon } from "@/components/icons/icon";
import { Button } from "@/components/ui";
import { Stepper } from "@/components/ui/stepper";
import { useIsleStore } from "@/store";

export function CreateProfileSteps() {
  const createProfile = useIsleStore((state) => state.createProfile);
  const node = useIsleStore((state) => state.node);
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const hasRequestedRef = useRef(false);

  useEffect(() => {
    if (!node || hasRequestedRef.current) return;
    createProfile();
    hasRequestedRef.current = true;
    node?.on("update-create-profile-status", ({ status }) => {
      setStatus(status);
    });
  }, [createProfile, node]);

  if (status === "pending") {
    return (
      <Center flexDirection="column" gap="6">
        <Heading h="2" fontSize="lg" textAlign="center" fontWeight="semibold" mb="3">
          Creating your idOS Profile
        </Heading>
        <Stepper stepsLength={3} index={0} />
        <Spinner size="xl" />
      </Center>
    );
  }

  if (status === "success") {
    return (
      <Center flexDirection="column" gap="6">
        <Heading h="2" fontSize="lg" textAlign="center" fontWeight="semibold" mb="3">
          idOS Profile created.
        </Heading>
        <Stepper stepsLength={3} index={1} />
        <Circle
          size="12"
          boxShadow="md"
          bg={{
            _dark: "brand.950",
            _light: "brand.400",
          }}
        >
          <Icon
            color={{
              _dark: "brand.600",
              _light: "brand.700",
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
          Error creating idOS Profile.
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
          Unexpected error occurred while creating your idOS Profile.
        </Text>
        <Button w="full" onClick={createProfile}>
          Try again
        </Button>
      </Center>
    );
  }

  return (
    <Center flexDirection="column" gap="6">
      <Heading h="2" fontSize="lg" textAlign="center" fontWeight="semibold" mb="3">
        Create your idOS Profile.
      </Heading>
      <Stepper stepsLength={3} index={0} />
      <Text
        color="neutral.500"
        fontWeight="medium"
        fontSize="sm"
        maxW="250px"
        mx="auto"
        textAlign="center"
      >
        Please confirm the transaction in your wallet.
      </Text>
    </Center>
  );
}
