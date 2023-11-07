import { Heading, type HeadingProps } from "@chakra-ui/react";

export const Title = (props: HeadingProps) => {
  return (
    <Heading
      as="h1"
      fontSize={[32, "40px"]}
      fontWeight={["semibold", "medium"]}
      lineHeight="1"
      {...props}
    />
  );
};
