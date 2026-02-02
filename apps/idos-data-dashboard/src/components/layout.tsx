import {
  Button,
  Link as ChakraLink,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  IconButton,
  Image,
  type LinkProps,
  useDisclosure,
} from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronRightIcon,
  CogIcon,
  ExternalLinkIcon,
  KeyRoundIcon,
  LogOutIcon,
  MenuIcon,
  Wallet2Icon,
} from "lucide-react";
import { NavLink, type NavLinkProps, useMatches } from "react-router-dom";
import { useAccount, useDisconnect } from "wagmi";
import { useWalletSelector } from "@/core/near";
import stellarKit from "@/core/stellar-kit";
import { useSigner, useUnsafeIdOS } from "@/idOS.provider";
import { useWalletStore } from "@/stores/wallet";

const Link = (props: NavLinkProps & LinkProps) => {
  return <ChakraLink as={NavLink} {...props} />;
};

const ConnectedWallet = () => {
  const { address } = useAccount();
  return (
    <div className="flex items-center gap-5 h-20">
      <div className="flex-shrink-0 w-[50px] h-[50px] bg-neutral-800 rounded-lg flex items-center justify-center">
        <img
          alt={`Connected wallet ${address}`}
          src="/idos-dashboard-logo-dark.svg"
          className="w-[50px] h-[50px]"
          loading="eager"
        />
      </div>
      <div>
        <div className="text-neutral-100">Connected Wallet</div>
        <div className="max-w-[180px] text-neutral-600 truncate">{address}</div>
      </div>
    </div>
  );
};

const ListItemLink = (props: NavLinkProps & LinkProps) => {
  return (
    <Link
      {...props}
      px={6}
      py={3}
      display="flex"
      alignItems="center"
      gap={5}
      rounded="xl"
      _hover={{ bg: "neutral.950" }}
      _activeLink={{
        bg: "neutral.950",
      }}
    />
  );
};

const DisconnectButton = () => {
  const { disconnectAsync } = useDisconnect();
  const { selector, setAccounts } = useWalletSelector();
  const queryClient = useQueryClient();
  const { setSigner } = useSigner();
  const client = useUnsafeIdOS();
  const { resetWallet, walletType } = useWalletStore();

  const handleDisconnect = async () => {
    if (walletType === "Stellar") await stellarKit.disconnect();
    if (walletType === "near") if (selector.isSignedIn()) await (await selector.wallet()).signOut();
    if (walletType === "evm") await disconnectAsync();
    if (client.state === "logged-in") await client.logOut();
    setSigner(undefined);
    setAccounts([]);
    queryClient.removeQueries();
    resetWallet();
  };

  return (
    <Button
      id="disconnect-wallet-btn"
      colorScheme="green"
      leftIcon={<LogOutIcon size={24} strokeWidth="1.5" />}
      onClick={handleDisconnect}
    >
      Disconnect wallet
    </Button>
  );
};

const Breadcrumbs = () => {
  const matches = useMatches();
  const crumbs = matches
    .filter((match) => Boolean((match.handle as { crumb: () => string })?.crumb))
    .map((match) => (match.handle as { crumb: () => string })?.crumb());

  const items = ["Dashboard", ...crumbs];
  return (
    <ul className="flex items-center gap-2.5 lg:gap-5">
      {items.map((item, index) => {
        return (
          <li key={item} className="flex items-center gap-2.5 lg:gap-5">
            <span className="text-sm px-4 py-2 bg-neutral-800 rounded-full">{item}</span>
            {index !== items.length - 1 ? <ChevronRightIcon size={18} aria-hidden="true" /> : null}
          </li>
        );
      })}
    </ul>
  );
};

export default function Layout({
  children,
  hasAccount,
}: {
  children?: React.ReactNode;
  hasAccount: boolean;
}) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <div className="flex min-h-screen">
      <nav className="sticky top-0 h-screen w-[380px] hidden lg:flex flex-col items-stretch">
        <div className="flex flex-col items-stretch flex-1 p-5 gap-5">
          <Link to="/" display="flex" alignItems="center" h={100}>
            <img
              src="/idos-dashboard-logo.svg"
              alt="idOS Dashboard logo"
              loading="eager"
              className="w-40 h-auto"
            />
          </Link>
          <div className="flex flex-col items-stretch flex-1 gap-2.5">
            <div className="px-5 bg-neutral-900 rounded-xl">
              <ConnectedWallet />
            </div>
            <div className="flex flex-col items-stretch flex-1 p-5 bg-neutral-900 rounded-xl">
              <ul className="flex flex-col gap-1.5">
                <li>
                  <ListItemLink to="/">
                    <KeyRoundIcon size={24} strokeWidth="1.5" />
                    <span>Credentials</span>
                  </ListItemLink>
                </li>
                {hasAccount ? (
                  <li>
                    <ListItemLink to="/wallets">
                      <Wallet2Icon size={24} strokeWidth="1.5" />
                      <span>Wallets</span>
                    </ListItemLink>
                  </li>
                ) : null}
              </ul>
              <div className="mt-auto flex flex-col gap-5 items-stretch">
                {hasAccount ? (
                  <ul className="flex flex-1 flex-col gap-1.5">
                    <ListItemLink to="/settings">
                      <CogIcon size={24} strokeWidth="1" />
                      <span>Settings</span>
                    </ListItemLink>
                  </ul>
                ) : null}
                <DisconnectButton />
              </div>
            </div>
          </div>
        </div>
      </nav>
      <div className="flex flex-col items-stretch flex-1 p-5 gap-0">
        <div className="flex items-center justify-between h-10 lg:h-[120px] mb-5 lg:mb-0">
          <IconButton aria-label="Open menu" onClick={onOpen} hideFrom="lg">
            <MenuIcon size={24} strokeWidth="1.5" />
          </IconButton>
          <Breadcrumbs />
        </div>
        {children}
      </div>
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg="neutral.900">
          <DrawerCloseButton />
          <DrawerHeader>
            <Link to="/" display="flex" alignItems="center" h={100}>
              <Image
                src="/idos-dashboard-logo.svg"
                alt="idOS Dashboard logo"
                w={120}
                h="auto"
                loading="eager"
              />
            </Link>
          </DrawerHeader>
          <DrawerBody>
            <div className="mb-5">
              <ConnectedWallet />
            </div>
            <ul className="flex flex-col gap-1.5">
              <li>
                <ListItemLink to="/">
                  <KeyRoundIcon size={24} strokeWidth="2.5" />
                  <span>Credentials</span>
                </ListItemLink>
              </li>
              {hasAccount && (
                <li>
                  <ListItemLink to="/wallets">
                    <Wallet2Icon size={24} strokeWidth="1.5" />
                    <span>Wallets</span>
                  </ListItemLink>
                </li>
              )}
            </ul>
          </DrawerBody>
          <DrawerFooter alignItems="stretch" justifyContent="start" flexDir="column" gap={5}>
            {hasAccount ? (
              <ul className="flex flex-1 flex-col gap-1.5">
                <ListItemLink to="/settings">
                  <CogIcon size={24} strokeWidth="1" />
                  <span>Settings</span>
                </ListItemLink>
              </ul>
            ) : null}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      <div className="fixed right-5 bottom-5 gap-2 bg-neutral-900 p-5 rounded-lg">
        <Button
          as={ChakraLink}
          isExternal
          href="https://drive.google.com/file/d/1CypYsXx--xCT05cjEbYE4TCT9ymF698r/view?usp=drive_link"
          target="_blank"
          color="green.200"
          display="inline-flex"
          alignItems="center"
          gap={2}
        >
          Privacy Policy <ExternalLinkIcon size={16} />
        </Button>
        <Button
          as={ChakraLink}
          isExternal
          href="https://drive.google.com/file/d/1OIoC1Y0TwBf-fR5g6FtZyvmjyv5iWY67/view?usp=drive_link"
          target="_blank"
          color="green.200"
          display="inline-flex"
          alignItems="center"
          gap={2}
        >
          User Agreement <ExternalLinkIcon size={16} />
        </Button>
      </div>
    </div>
  );
}
