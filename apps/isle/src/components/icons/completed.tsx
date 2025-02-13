import { Flex } from "@chakra-ui/react";
import { HiCheck } from "react-icons/hi";

import { Icon, type IconProps } from "./icon";

export function Completed(props: IconProps) {
  return (
    <Flex
      alignItems="center"
      justifyContent="center"
      w={12}
      h={12}
      borderRadius="full"
      bg="aquamarine.950"
      mx="auto"
    >
      <Icon {...props}>
        <HiCheck />
      </Icon>
    </Flex>
  );
}
