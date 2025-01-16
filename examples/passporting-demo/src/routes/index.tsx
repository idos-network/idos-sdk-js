import { Container, Stack, Text } from "@chakra-ui/react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <Container h="100%">
      <Stack gap="4" h="100%">
        <Text>A demo application to showcase the idOS Passporting functionality.</Text>
      </Stack>
    </Container>
  );
}
