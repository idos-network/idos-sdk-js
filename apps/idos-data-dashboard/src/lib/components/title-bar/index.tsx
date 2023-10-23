import { Flex } from "@chakra-ui/react";
import { PropsWithChildren } from "react";

export const TitleBar = ({ children }: PropsWithChildren) => {
  return (
    <Flex
      align="center"
      justify="space-between"
      flex={1}
      gap={5}
      h={78}
      px={7}
      py={3}
      bg="neutral.900"
      rounded="xl"
    >
      {children}
    </Flex>
  );
};
