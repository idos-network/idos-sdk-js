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
} from "lucide-react";
import { Fragment, lazy, type PropsWithChildren, Suspense, useEffect } from "react";
import useDisclosure from "@/hooks/use-disclosure";
import { cn } from "@/lib/utils";
import { dashboardActor } from "@/machines/dashboard.actor";
import { selectWalletAddress, selectWalletType } from "@/machines/selectors";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { Button, buttonVariants } from "./ui/button";

const MobileNav = lazy(() => import("./mobile-nav"));

export function ConnectedWallet() {
  const address = useSelector(dashboardActor, selectWalletAddress);
  const walletType = useSelector(dashboardActor, selectWalletType);

  if (!address) {
    return null;
  }

  const isFaceSign = walletType === "FaceSign";

  return (
    <div className="flex h-20 items-center gap-5">
      <div className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-lg bg-muted">
        {isFaceSign ? (
          <img
            alt="FaceSign wallet"
            src="/facesign-filled.svg"
            width={36}
            height={36}
            className="h-9 w-9"
            loading="eager"
          />
        ) : (
          <>
            <img
              alt={`Connected wallet ${address}`}
              src="/wallet-light.svg"
              width={50}
              height={50}
              className="h-[50px] w-[50px] dark:hidden"
              loading="eager"
            />
            <img
              alt={`Connected wallet ${address}`}
              src="/wallet.svg"
              width={50}
              height={50}
              className="hidden h-[50px] w-[50px] dark:block"
              loading="eager"
            />
          </>
        )}
      </div>
      <div>
        <div className="text-card-foreground">
          {isFaceSign ? "idOS FaceSign" : "Connected Wallet"}
        </div>
        <code className="max-w-[180px] truncate text-muted-foreground">
          {address.slice(0, 6)}...{address.slice(-4)}
        </code>
      </div>
    </div>
  );
}

function ListItemLink({ to, children }: { to: LinkProps["to"]; children: React.ReactNode }) {
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

const externalLinkClasses = "flex items-center gap-5 rounded-xl px-6 py-3 hover:bg-hover-subtle";

export function MainNavLinks() {
  return (
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
      {import.meta.env.DEV ? (
        <li>
          <a href="#/" className={externalLinkClasses} target="_blank" rel="noopener noreferrer">
            <CircleDollarSignIcon size={24} strokeWidth="1.5" />
            <span>Staking</span>
            <ArrowUpRightFromSquare size={16} strokeWidth="1.5" className="ml-auto" />
          </a>
        </li>
      ) : null}
    </ul>
  );
}

export function FooterNavLinks() {
  return (
    <ul className="flex flex-1 flex-col gap-1.5">
      <li>
        <a
          // @todo: update to the actual Legacy app domain if/when it changes
          href="https://app.idos.network/"
          className={externalLinkClasses}
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
  );
}

export function DisconnectButton() {
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
    .map((match) => ({
      label: match.staticData.breadcrumb as string,
      to: match.pathname,
    }));

  const items = [{ label: "Dashboard", to: "/" }, ...crumbs];
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <Fragment key={`${item.label}-${index}`}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    className="rounded-full bg-muted px-4 py-2 font-normal text-foreground"
                    render={<Link to={item.to} />}
                  >
                    {item.label}
                  </BreadcrumbLink>
                )}
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
              width={160}
              height={52}
              loading="eager"
              className="h-auto w-40 dark:hidden"
            />
            <img
              src="/logo.svg"
              alt="idOS logo"
              width={160}
              height={52}
              loading="eager"
              className="hidden h-auto w-40 dark:block"
            />
          </Link>
          <div className="flex flex-1 flex-col items-stretch gap-5">
            <div className="rounded-xl bg-card px-5">
              <ConnectedWallet />
            </div>
            <div className="flex flex-1 flex-col items-stretch rounded-xl bg-card p-5">
              <MainNavLinks />
              <div className="mt-auto flex flex-col items-stretch gap-5">
                <FooterNavLinks />
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
      {isOpen && (
        <Suspense>
          <MobileNav isOpen={isOpen} onOpen={onOpen} onClose={onClose} />
        </Suspense>
      )}
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
