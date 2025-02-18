import { Image, Text, chakra } from "@chakra-ui/react";

export function Footer() {
  return (
    <chakra.footer>
      <Text
        display={{ base: "none", sm: "flex" }}
        color="gray.500"
        fontSize="sm"
        textAlign="center"
        placeContent="center"
        alignItems="center"
        gap="2"
        fontWeight="medium"
      >
        Powered by <Image src="/footer-logo.svg" alt="Powered by idOS" />
      </Text>
    </chakra.footer>
  );
}
