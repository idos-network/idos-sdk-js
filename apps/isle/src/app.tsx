import { Center, Heading, Image, Text, chakra } from "@chakra-ui/react";
import { Header } from "./components/header";
import { ProfileIcon } from "./components/icons/profile";

interface LayoutProps {
  children?: JSX.Element;
}
function Layout({ children }: LayoutProps) {
  return (
    <chakra.div maxW="366px" mx="auto" bg="neutral.950" borderRadius="25px">
      <chakra.main>
        <Header icon={<ProfileIcon />} badgeProps={{ children: "No Profile", variant: "subtle" }} />
        {children}
        <chakra.footer display={{ smDown: "none", sm: "flex" }} justifyContent="center">
          <Text
            color="gray.500"
            fontSize="sm"
            textAlign="center"
            placeContent="center"
            display="flex"
            alignItems="center"
            gap="2"
          >
            Powered by <Image src="/footer-logo.svg" alt="Powered by idOS" />
          </Text>
        </chakra.footer>
      </chakra.main>
    </chakra.div>
  );
}

export function App() {
  return (
    <Layout>
      <Center flexDir="column" gap="2" display={{ smDown: "none", sm: "flex" }}>
        <Heading fontSize="2xl">Own your data</Heading>
        <Text textAlign="center">
          The idOS Isle is the “window” on a target application into the idOS
        </Text>
      </Center>
    </Layout>
  );
}
