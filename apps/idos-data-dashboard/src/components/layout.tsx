import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronRightIcon,
  CogIcon,
  ExternalLinkIcon,
  KeyRoundIcon,
  LogOutIcon,
  MenuIcon,
  Wallet2Icon,
  XIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { type NavLinkProps, useLocation, useMatches } from "react-router-dom";
import { useAccount, useDisconnect } from "wagmi";
import { useWalletSelector } from "@/core/near";
import stellarKit from "@/core/stellar-kit";
import useDisclosure from "@/hooks/useDisclosure";
import { useSigner, useUnsafeIdOS } from "@/idOS.provider";
import { cn } from "@/lib/utils";
import { useWalletStore } from "@/stores/wallet";
import { Button } from "./ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader } from "./ui/drawer";
import { Link, type LinkProps as ShadcnLinkProps } from "./ui/link";

const ConnectedWallet = () => {
  const { address } = useAccount();
  return (
    <div className="flex items-center gap-5 h-20">
      <div className="shrink-0 w-[50px] h-[50px] bg-neutral-800 rounded-lg flex items-center justify-center">
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

const ListItemLink = (props: NavLinkProps & ShadcnLinkProps) => {
  return (
    <Link
      {...props}
      variant="nav"
      className={cn("px-6 py-3 flex items-center gap-5 [&:hover]:bg-neutral-950!", props.className)}
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
    <Button id="disconnect-wallet-btn" variant="default" onClick={handleDisconnect}>
      <LogOutIcon size={24} strokeWidth="1.5" />
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
  const { pathname } = useLocation();
  const [prevPathname, setPrevPathname] = useState(pathname);

  useEffect(() => {
    if (prevPathname !== pathname) {
      if (isOpen) onClose();
      setPrevPathname(pathname);
    }
  }, [pathname, prevPathname, isOpen, onClose]);

  return (
    <div className="flex min-h-screen">
      <nav className="sticky top-0 h-screen w-[380px] hidden lg:flex flex-col items-stretch">
        <div className="flex flex-col items-stretch flex-1 p-5 gap-5">
          <Link to="/" className="flex items-center h-[100px]">
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
          <Button
            variant="secondary"
            aria-label="Open menu"
            onClick={onOpen}
            className="block lg:hidden"
          >
            <MenuIcon size={24} strokeWidth="1.5" />
          </Button>
          <Breadcrumbs />
        </div>
        {children}
      </div>
      <Drawer open={isOpen} onOpenChange={(open) => (open ? onOpen() : onClose())} direction="left">
        <DrawerContent className="bg-neutral-900">
          <DrawerHeader className="relative">
            <DrawerClose asChild>
              <Button variant="ghost" className="absolute right-4 top-4" aria-label="Close menu">
                <XIcon size={20} />
              </Button>
            </DrawerClose>
            <Link to="/" className="flex items-center h-[100px] bg-transparent!">
              <img
                src="/idos-dashboard-logo.svg"
                alt="idOS Dashboard logo"
                className="w-[120px] h-auto"
                loading="eager"
              />
            </Link>
          </DrawerHeader>
          <div className="p-4 flex-1 overflow-y-auto">
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
          </div>
          <DrawerFooter className="flex-col items-stretch gap-5">
            {hasAccount ? (
              <ul className="flex flex-1 flex-col gap-1.5">
                <ListItemLink to="/settings">
                  <CogIcon size={24} strokeWidth="1" />
                  <span>Settings</span>
                </ListItemLink>
              </ul>
            ) : null}
            <DisconnectButton />
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      <div className="fixed right-5 bottom-5 gap-2 bg-neutral-900 p-5 rounded-lg flex items-stretch">
        <Button
          variant="secondary"
          className="flex items-center gap-2 text-green-200!"
          nativeButton={false}
          render={
            <a
              href="https://www.idos.network/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              Privacy Policy <ExternalLinkIcon size={16} />
            </a>
          }
        />
        <Button
          variant="secondary"
          className="flex items-center gap-2 text-green-200!"
          nativeButton={false}
          render={
            <a
              href="https://www.idos.network/legal/user-agreement"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              User Agreement <ExternalLinkIcon size={16} />
            </a>
          }
        />
      </div>
    </div>
  );
}
