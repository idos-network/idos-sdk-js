import { Center, Container, Heading } from "@chakra-ui/react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <Container h="100%">
      <Center h="100%">
        <Heading as="h1">Welcome to the idOS Dashboard for dApps</Heading>
      </Center>
    </Container>
  );
}
