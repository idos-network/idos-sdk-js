import { Flex, Heading, Image, Link, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";

import { Completed } from "@/components/icons/completed";
import { Stepper } from "@/components/ui/stepper";
import { useIsleStore } from "@/store";

export function CreateProfileSteps() {
  const createProfile = useIsleStore((state) => state.createProfile);
  const processState = useIsleStore((state) => state.processState);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [, setError] = useState(false); // @todo: add and render error state.

  useEffect(() => {
    createProfile();
  }, [createProfile]);

  useEffect(() => {
    const { name, status } = processState;
    if (name === "create-profile" && status === "success") {
      setSuccess(true);
    }
    if (name === "create-profile" && status === "error") {
      setError(true);
    }
    if (name === "create-profile" && status === "pending") {
      setLoading(true);
    }
  }, [processState]);

  return (
    <Flex flexDirection="column" gap="6">
      {!loading && (
        <Heading h="2" fontSize="lg" textAlign="center" fontWeight="semibold" mb="3">
          Create your idOS Profile.
        </Heading>
      )}
      <Flex>
        <Stepper stepsLength={3} index={0} />
      </Flex>
      {loading ? (
        <Flex
          flexDir="column"
          w="12"
          h="12"
          borderRadius="full"
          border="3px solid"
          borderColor={{ _dark: "aquamarine.950", _light: "aquamarine.200" }}
          mx="auto"
        />
      ) : (
        <>
          {success ? (
            // @todo: add a success animation.
            <Completed w="20" mx="auto" color="aquamarine.700" />
          ) : (
            <>
              <Text
                color="neutral.500"
                fontWeight="medium"
                fontSize="sm"
                maxW="250px"
                mx="auto"
                textAlign="center"
              >
                {/* @todo: Should we rename this process to pick an authentication method? */}
                Sign the message in your wallet to authenticate with idOS.
              </Text>

              <Flex
                bg={{
                  _dark: "neutral.800",
                  _light: "neutral.200",
                }}
                rounded="3xl"
                p="4"
                gap="2"
                alignItems="start"
              >
                <Image src="/lit.svg" alt="lit" />
                <Flex flexDir="column" gap="2">
                  <Text color="neutral.500" fontSize="sm">
                    If you haven’t previously added this wallet to idOS, a private/public keypair
                    from LIT will be created to encrypt your data.
                  </Text>
                  <Link
                    variant="plain"
                    href="https://litprotocol.com/docs/lit-protocol-overview/lit-mpc-encryption"
                    target="_blank"
                    color={{ _dark: "aquamarine.500", _light: "neutral.800" }}
                    rel="noreferrer"
                    fontWeight="medium"
                    fontSize="xs"
                  >
                    Learn more about LIT’s MPC encryption.
                  </Link>
                </Flex>
              </Flex>
            </>
          )}
        </>
      )}
    </Flex>
  );
}
