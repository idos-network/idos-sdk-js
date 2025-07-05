import { Icon as ChakraIcon, type IconProps as ChakraIconProps } from "@chakra-ui/react";

export interface IconProps extends Omit<ChakraIconProps, "fontSize"> {}

export function Icon(props: IconProps) {
  const { boxSize = "8", ...rest } = props;

  return <ChakraIcon boxSize={boxSize} {...rest} />;
}
