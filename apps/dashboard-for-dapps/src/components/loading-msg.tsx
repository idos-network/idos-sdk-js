import { HStack, Spinner, Text } from "@chakra-ui/react";
import type { PropsWithChildren } from "react";

export default function LoadingMsg({
  loading,
  message,
  children,
}: PropsWithChildren<{ loading: boolean; message: string }>) {
  if (!loading) return <>{children}</>;
  return (
    <HStack align="center" justify="center" h="50vh">
      {/* TODO: make height full of parent container */}
      <Spinner />
      <Text>{message}</Text>
    </HStack>
  );
}
