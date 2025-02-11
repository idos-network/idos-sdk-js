import { Flex, Heading, Image, Link, Text } from "@chakra-ui/react";
import { useState } from "react";

import { Completed } from "@/components/icons/completed";
import { Stepper } from "@/components/ui/stepper";

export function CreateProfileSteps() {
  const [loading] = useState(false);
  const [success] = useState(false);
  return (
    <Flex flexDirection="column" gap={6}>
      {!loading && (
        <Heading h={2} fontSize={18} textAlign="center" fontWeight="semibold" mb="3">
          Create your idOS Profile.
        </Heading>
      )}
      <Flex>
        <Stepper stepsLength={3} index={0} />
      </Flex>
      {loading ? (
        <Flex
          flexDir="column"
          w={12}
          h={12}
          borderRadius="full"
          border="3px solid"
          borderColor="aquamarine.950"
          mx="auto"
        />
      ) : (
        <>
          {success ? (
            // @todo: add a success animation.
            <Completed w={20} mx="auto" color="aquamarine.700" />
          ) : (
            <>
              <Text
                color="neutral.500"
                fontWeight="medium"
                fontSize="sm"
                maxW={250}
                mx="auto"
                textAlign="center"
              >
                Sign the message in your wallet to authenticate with idOS.
              </Text>

              <Flex bg="neutral.800" rounded="2xl" p={4} gap={2} alignItems="start">
                <Image src="/lit.svg" alt="lit" />
                <Flex flexDir="column">
                  <Text color="neutral.500" fontSize="sm">
                    If you haven’t previously added this wallet to idOS, a private/public keypair
                    from LIT will be created to encrypt your data.
                  </Text>
                  <Link
                    variant="plain"
                    href="https://litprotocol.com/docs/lit-protocol-overview/lit-mpc-encryption"
                    target="_blank"
                    color={{
                      _dark: "aquamarine.500",
                      _light: "neutral.800",
                    }}
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
