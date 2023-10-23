import { Box, Button, Heading, Stack, Text } from "@chakra-ui/react";

type AddCredentialCardProps = {
  onAddCredential: () => void;
};

export const AddCredentialCard = (props: AddCredentialCardProps) => {
  return (
    <Stack gap={8} p={7} bg="neutral.900" rounded="xl">
      <Heading fontSize="2xl" fontWeight="medium">
        You have 0 credentials added.
      </Heading>
      <Text color="neutral.600" fontSize="2xl">
        Create your first credential and store it on the idOS.
      </Text>
      <Box>
        <Button colorScheme="green" onClick={props.onAddCredential} size="xl">
          Add credential
        </Button>
      </Box>
    </Stack>
  );
};
