import { chakra } from "@chakra-ui/react";
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
        <chakra.footer
          justifyContent="center"
          alignItems="center"
          display={{ smDown: "none", md: "flex" }}
        >
          <chakra.p
            display="flex"
            gap={2}
            justifyContent="center"
            color="neutral.500"
            textAlign="center"
          >
            Powered by <img src="/footer-logo.svg" alt="Powered by idOS" />
          </chakra.p>
        </chakra.footer>
      </chakra.main>
    </chakra.div>
  );
}

export function App() {
  return (
    <Layout>
      <div />
    </Layout>
  );
}
