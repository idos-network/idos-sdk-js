import { Heading, type HeadingProps } from "@chakra-ui/react";

export const Title = (props: HeadingProps) => {
  return (
    <Heading
      as="h1"
      fontSize="40px"
      fontWeight="medium"
      lineHeight="1"
      {...props}
    />
  );
};
