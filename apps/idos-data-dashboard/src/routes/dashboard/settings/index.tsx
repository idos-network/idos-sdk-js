import { useIdOS } from "@/idOS.provider";
import { Box, Button, HStack, Heading, Stack, Text, VStack } from "@chakra-ui/react";
import { FileLockIcon } from "lucide-react";

export function Component() {
  const idOSClient = useIdOS();

  return (
    <VStack align="stretch" flex={1} gap={5}>
      <HStack
        justifyContent="space-between"
        h={{
          base: 14,
          lg: 20,
        }}
        p={5}
        bg="neutral.900"
        rounded="xl"
      >
        <Heading
          as="h1"
          fontSize={{
            base: "x-large",
            lg: "xx-large",
          }}
        >
          Settings
        </Heading>
      </HStack>
      <Stack direction="column" gap={2.5}>
        <Heading as="h2" size="md">
          Back up your password or secret key
        </Heading>
        <Box p={5} bg="neutral.900" rounded="xl">
          <Stack
            alignItems={{
              base: "stretch",
              md: "center",
            }}
            justifyContent="space-between"
            direction={{
              base: "column",
              md: "row",
            }}
            spacing={5}
          >
            <Text>Create a backup of your idOS password or secret key</Text>
            <Button
              colorScheme="green"
              leftIcon={<FileLockIcon size={20} />}
              onClick={async () => {
                if (idOSClient.state !== "logged-in") throw new Error("User not authenticated");

                const { id, recipient_encryption_public_key } = idOSClient.user;
                await idOSClient.enclaveProvider.ready(id, recipient_encryption_public_key);
                await idOSClient.enclaveProvider.backupPasswordOrSecret();
              }}
            >
              Back up your idOS key
            </Button>
          </Stack>
        </Box>
      </Stack>
    </VStack>
  );
}

Component.displayName = "Settings";
