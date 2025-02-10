import { Stepper } from "@/components/ui/stepper";
import { Image, Text, chakra } from "@chakra-ui/react";
import { useState } from "react";

export function CreateProfileSteps() {
  const [loading] = useState(false);
  const [success] = useState(true);
  return (
    <chakra.div display={"flex"} flexDirection={"column"} gap={6}>
      {!loading && (
        <chakra.h2 fontSize={18} textAlign="center" fontWeight="semibold" mb="3">
          Create your idOS Profile.
        </chakra.h2>
      )}
      <chakra.div>
        <Stepper stepsLength={3} index={0} />
      </chakra.div>
      {loading ? (
        <chakra.div
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
            <Image src="/completed.svg" alt="completed" w={20} mx="auto" />
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

              <chakra.div
                bg="neutral.800"
                rounded="2xl"
                p={4}
                display="flex"
                gap={2}
                alignItems="start"
              >
                <Image src="/lit.svg" alt="lit" />
                <chakra.div>
                  <Text color="neutral.500" fontSize="sm">
                    If you haven’t previously added this wallet to idOS, a private/public keypair
                    from LIT will be created to encrypt your data.
                  </Text>
                  <chakra.a
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
                  </chakra.a>
                </chakra.div>
              </chakra.div>
            </>
          )}
        </>
      )}
    </chakra.div>
  );
}
