import {
  Link,
  type LinkProps,
  useMatches,
  useMatchRoute,
  useRouterState,
} from "@tanstack/react-router";
import { useSelector } from "@xstate/react";
import {
  ArchiveIcon,
  ArrowUpRightFromSquare,
  CircleDollarSignIcon,
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
    <div className="flex h-20 items-center gap-5">
      <div className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-lg bg-muted">
        <img
          alt={`Connected wallet ${address}`}
          src="/wallet.svg"
          className="h-[50px] w-[50px]"
          loading="eager"
        />
      </div>
      <div>
        <div className="text-card-foreground">Connected Wallet</div>
        <code className="max-w-[180px] truncate text-muted-foreground">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </code>
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
        "flex items-center gap-5 rounded-xl px-6 py-3 hover:bg-hover-subtle active:bg-hover-subtle",
        isActive && "bg-hover-subtle",
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
              {!isLast ? <BreadcrumbSeparator /> : null}
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
      <nav className="sticky top-0 hidden h-screen w-[380px] flex-col items-stretch lg:flex">
        <div className="flex flex-1 flex-col items-stretch gap-5 p-5 pr-0">
          <Link to="/" className="flex h-[100px] items-center">
            <img
              src="/logo-light.svg"
              alt="idOS logo"
              loading="eager"
              className="h-auto w-40 dark:hidden"
            />
            <img
              src="/logo.svg"
              alt="idOS logo"
              loading="eager"
              className="hidden h-auto w-40 dark:block"
            />
          </Link>
          <div className="flex flex-1 flex-col items-stretch gap-5">
            <div className="rounded-xl bg-card px-5">
              <ConnectedWallet />
            </div>
            <div className="flex flex-1 flex-col items-stretch rounded-xl bg-card p-5">
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

                <li>
                  <a
                    // @todo: change to the actual staking app once we have a domain
                    href="https://idos-staking-app.vercel.app/"
                    className="flex items-center gap-5 rounded-xl px-6 py-3 hover:bg-hover-subtle"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <CircleDollarSignIcon size={24} strokeWidth="1.5" />
                    <span>Staking</span>
                    <ArrowUpRightFromSquare size={16} strokeWidth="1.5" className="ml-auto" />
                  </a>
                </li>
              </ul>
              <div className="mt-auto flex flex-col items-stretch gap-5">
                <ul className="flex flex-1 flex-col gap-1.5">
                  <li>
                    <a
                      // @todo: change to the actual staking app once we have a domain
                      href="https://app.idos.network/"
                      className="flex items-center gap-5 rounded-xl px-6 py-3 hover:bg-hover-subtle"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ArchiveIcon size={24} strokeWidth="1.5" />
                      <span>Legacy</span>
                      <ArrowUpRightFromSquare size={16} strokeWidth="1.5" className="ml-auto" />
                    </a>
                  </li>
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
      <div className="flex flex-1 flex-col items-stretch gap-5 p-5 lg:pl-0">
        <div className="mb-5 flex h-10 items-center justify-between lg:mb-0 lg:h-[100px]">
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
        <DrawerContent className="bg-card">
          <DrawerHeader className="relative">
            <DrawerClose asChild>
              <Button
                variant="ghost"
                className="absolute top-4 right-4"
                aria-label="Close menu"
                size="icon"
              >
                <XIcon size={20} />
              </Button>
            </DrawerClose>
            <Link to="/" className="flex h-[100px] items-center">
              <img
                src="/logo-light.svg"
                alt="idOS logo"
                className="h-auto w-[120px] dark:hidden"
                loading="eager"
              />
              <img
                src="/logo.svg"
                alt="idOS logo"
                className="hidden h-auto w-[120px] dark:block"
                loading="eager"
              />
            </Link>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto p-4">
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

              <li>
                <a
                  href="https://idos-staking-app.vercel.app/"
                  className="flex items-center gap-5 rounded-xl px-6 py-3 hover:bg-hover-subtle"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <CircleDollarSignIcon size={24} strokeWidth="1.5" />
                  <span>Staking</span>
                  <ArrowUpRightFromSquare size={16} strokeWidth="1.5" className="ml-auto" />
                </a>
              </li>
            </ul>
          </div>
          <DrawerFooter className="flex-col items-stretch gap-5">
            <ul className="flex flex-1 flex-col gap-1.5">
              <li>
                <a
                  href="https://app.idos.network/"
                  className="flex items-center gap-5 rounded-xl px-6 py-3 hover:bg-hover-subtle"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ArchiveIcon size={24} strokeWidth="1.5" />
                  <span>Legacy</span>
                  <ArrowUpRightFromSquare size={16} strokeWidth="1.5" className="ml-auto" />
                </a>
              </li>
              <li>
                <ListItemLink to="/settings">
                  <CogIcon size={24} strokeWidth="1" />
                  <span>Settings</span>
                </ListItemLink>
              </li>
            </ul>

            <DisconnectButton />

            <div className="flex gap-2">
              <a
                href="https://www.idos.network/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "sm" }),
                  "flex flex-1 items-center gap-2",
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
                  "flex flex-1 items-center gap-2",
                )}
              >
                User Agreement <ExternalLinkIcon size={14} />
              </a>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      <div className="fixed right-5 bottom-5 hidden items-stretch gap-2 rounded-lg bg-card p-5 lg:flex">
        <a
          href="https://www.idos.network/legal/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({
              variant: "secondary",
            }),
            "flex items-center gap-2",
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
            "flex items-center gap-2",
          )}
        >
          User Agreement <ExternalLinkIcon size={16} />
        </a>
      </div>
    </div>
  );
}
