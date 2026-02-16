import {
  Link,
  type LinkProps,
  useMatches,
  useMatchRoute,
  useRouterState,
} from "@tanstack/react-router";
import { useSelector } from "@xstate/react";
import {
  CogIcon,
  ExternalLinkIcon,
  KeyRoundIcon,
  LogOutIcon,
  MenuIcon,
  Wallet2Icon,
  XIcon,
} from "lucide-react";
import { Fragment, type PropsWithChildren, useEffect } from "react";
import useDisclosure from "@/hooks/use-disclosure";
import { cn } from "@/lib/utils";
import { dashboardActor } from "@/machines/dashboard.actor";
import { selectWalletAddress } from "@/machines/selectors";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { Button, buttonVariants } from "./ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader } from "./ui/drawer";

function ConnectedWallet() {
  const address = useSelector(dashboardActor, selectWalletAddress);
  return (
    <div className="flex items-center gap-5 h-20">
      <div className="shrink-0 w-[50px] h-[50px] bg-neutral-800 rounded-lg flex items-center justify-center">
        <img
          alt={`Connected wallet ${address}`}
          src="/wallet.svg"
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
}

function ListItemLink({ to, children }: LinkProps) {
  const matchRoute = useMatchRoute();
  const isActive = matchRoute({ to });
  return (
    <Link
      to={to}
      className={cn(
        "px-6 py-3 flex items-center gap-5 rounded-xl hover:bg-neutral-950 active:bg-neutral-950",
        isActive && "bg-neutral-950",
      )}
    >
      {children}
    </Link>
  );
}

function DisconnectButton() {
  const handleDisconnect = () => {
    dashboardActor.send({ type: "DISCONNECT" });
  };

  return (
    <Button id="disconnect-wallet-btn" size="lg" onClick={handleDisconnect}>
      <LogOutIcon size={24} strokeWidth="1.5" />
      Disconnect wallet
    </Button>
  );
}

function Breadcrumbs() {
  const matches = useMatches();
  const crumbs = matches
    .filter((match) => match.staticData?.breadcrumb)
    .map((match) => match.staticData.breadcrumb as string);

  const items = ["Dashboard", ...crumbs];
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <Fragment key={item}>
              <BreadcrumbItem>
                <BreadcrumbPage>{item}</BreadcrumbPage>
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function Layout({ children }: PropsWithChildren) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  return (
    <div className="flex min-h-screen lg:gap-5">
      <nav className="sticky top-0 h-screen w-[380px] hidden lg:flex flex-col items-stretch">
        <div className="flex flex-col items-stretch flex-1 p-5 pr-0 gap-5">
          <Link to="/" className="flex items-center h-[100px]">
            <img src="/logo.svg" alt="idOS logo" loading="eager" className="w-40 h-auto" />
          </Link>
          <div className="flex flex-col items-stretch flex-1 gap-5">
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

                <li>
                  <ListItemLink to="/wallets">
                    <Wallet2Icon size={24} strokeWidth="1.5" />
                    <span>Wallets</span>
                  </ListItemLink>
                </li>
              </ul>
              <div className="mt-auto flex flex-col gap-5 items-stretch">
                <ul className="flex flex-1 flex-col gap-1.5">
                  <ListItemLink to="/settings">
                    <CogIcon size={24} strokeWidth="1" />
                    <span>Settings</span>
                  </ListItemLink>
                </ul>

                <DisconnectButton />
              </div>
            </div>
          </div>
        </div>
      </nav>
      <div className="flex flex-col items-stretch flex-1 p-5 lg:pl-0 gap-5">
        <div className="flex items-center justify-between h-10 lg:h-[100px] mb-5 lg:mb-0">
          <Button
            variant="secondary"
            aria-label="Open menu"
            onClick={onOpen}
            size="icon-lg"
            className="lg:hidden"
          >
            <MenuIcon />
          </Button>
          <Breadcrumbs />
        </div>
        {children}
      </div>
      <Drawer open={isOpen} onOpenChange={(open) => (open ? onOpen() : onClose())} direction="left">
        <DrawerContent className="bg-neutral-900">
          <DrawerHeader className="relative">
            <DrawerClose asChild>
              <Button
                variant="ghost"
                className="absolute right-4 top-4"
                aria-label="Close menu"
                size="icon"
              >
                <XIcon size={20} />
              </Button>
            </DrawerClose>
            <Link to="/" className="flex items-center h-[100px]">
              <img src="/logo.svg" alt="idOS logo" className="w-[120px] h-auto" loading="eager" />
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

              <li>
                <ListItemLink to="/wallets">
                  <Wallet2Icon size={24} strokeWidth="1.5" />
                  <span>Wallets</span>
                </ListItemLink>
              </li>
            </ul>
          </div>
          <DrawerFooter className="flex-col items-stretch gap-5">
            <ul className="flex flex-1 flex-col gap-1.5">
              <ListItemLink to="/settings">
                <CogIcon size={24} strokeWidth="1" />
                <span>Settings</span>
              </ListItemLink>
            </ul>

            <DisconnectButton />

            <div className="flex gap-2">
              <a
                href="https://www.idos.network/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "sm" }),
                  "flex-1 flex items-center gap-2 text-green-200",
                )}
              >
                Privacy Policy <ExternalLinkIcon size={14} />
              </a>
              <a
                href="https://www.idos.network/legal/user-agreement"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "sm" }),
                  "flex-1 flex items-center gap-2 text-green-200",
                )}
              >
                User Agreement <ExternalLinkIcon size={14} />
              </a>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      <div className="fixed right-5 bottom-5 gap-2 bg-neutral-900 p-5 rounded-lg hidden lg:flex items-stretch">
        <a
          href="https://www.idos.network/legal/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({
              variant: "secondary",
            }),
            "flex items-center gap-2 text-green-200",
          )}
        >
          Privacy Policy <ExternalLinkIcon size={16} />
        </a>

        <a
          href="https://www.idos.network/legal/user-agreement"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({
              variant: "secondary",
            }),
            "flex items-center gap-2 text-green-200",
          )}
        >
          User Agreement <ExternalLinkIcon size={16} />
        </a>
      </div>
    </div>
  );
}
