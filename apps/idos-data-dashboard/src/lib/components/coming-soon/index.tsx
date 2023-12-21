import { Box, type BoxProps, Text } from "@chakra-ui/react";

export const ComingSoon = (props: BoxProps) => {
  return (
    <Box px={4} py={1.5} bg="neutral.800" rounded="lg" {...props}>
      <Text as="span" color="neutral.600">
        Coming Soon
      </Text>
    </Box>
  );
};
