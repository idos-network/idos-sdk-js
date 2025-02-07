import { Icon as ChakraIcon, type IconProps as ChakraIconProps } from "@chakra-ui/react";

export interface IconProps extends Omit<ChakraIconProps, "fontSize"> {}

export function Icon(props: IconProps) {
  const { size = "md", boxSize = "8", ...rest } = props;

  return (
    <ChakraIcon
      asChild
      boxSize={boxSize}
      color={{
        _dark: "gray.200",
        _light: "black",
      }}
      {...rest}
    />
  );
}
