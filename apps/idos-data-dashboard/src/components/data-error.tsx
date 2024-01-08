import { Button, Stack, Text } from "@chakra-ui/react";

type DataErrorProps = {
  onRetry: () => void;
};

export const DataError = ({ onRetry }: DataErrorProps) => {
  return (
    <Stack
      align={{
        base: "stretch",
        lg: "center"
      }}
      gap={2.5}
      flexDir={{
        base: "column",
        lg: "row"
      }}
      p={5}
      bg="neutral.900"
      rounded="xl"
    >
      <Text color="red.500">Something went wrong, please retry.</Text>
      <Button size="sm" variant="outline" onClick={onRetry}>
        Retry
      </Button>
    </Stack>
  );
};
