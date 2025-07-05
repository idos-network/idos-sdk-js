import { chakra, Image, Text } from "@chakra-ui/react";

export function Footer() {
  return (
    <chakra.footer>
      <Text
        display="flex"
        alignItems="center"
        placeContent="center"
        gap="2"
        color="muted.fg"
        fontSize="sm"
        textAlign="center"
        fontWeight="medium"
      >
        Powered by <Image src="/idOS-powered.svg" alt="Powered by idOS" />
      </Text>
    </chakra.footer>
  );
}
