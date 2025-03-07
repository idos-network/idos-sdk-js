import { HStack, Image, Text } from "@chakra-ui/react";

export function Disclaimer({ name, logo }: { name: string; logo: string }) {
  return (
    <HStack
      gap="2"
      bg={{ _dark: "neutral.800", _light: "neutral.200" }}
      p="4"
      borderRadius="3xl"
      alignItems="center"
    >
      <Image src={logo} alt={name} width="30px" height="30px" rounded="full" />
      <Text fontSize="xs" color="neutral.500">
        Make sure you trust{" "}
        <Text as="span" color="neutral.400" fontWeight="semibold">
          {name}
        </Text>
        , as you may be sharing sensitive data with this site or app.
      </Text>
    </HStack>
  );
}
