import { HStack, Image, Text } from "@chakra-ui/react";

interface GranteeInfoProps {
  name: string;
  logo: string;
}

export function GranteeInfo({ name, logo }: GranteeInfoProps) {
  return (
    <HStack gap="2.5" alignItems="flex-start">
      <Image src={logo} alt={name} width="30px" height="30px" rounded="full" />
      <Text>
        <Text as="span" fontWeight="medium" fontSize="lg">
          {name}
        </Text>{" "}
        <Text as="span" fontSize="sm">
          is asking for permissions to:
        </Text>
      </Text>
    </HStack>
  );
}
