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
import { Fragment, lazy, Suspense, useEffect } from "react";
import { Link, Outlet, useLocation, useMatches } from "react-router";
import useDisclosure from "@/hooks/use-disclosure";
import { cn } from "@/lib/utils";
import { selectWalletAddress, selectWalletType } from "@/machines/selectors";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button, buttonVariants } from "@/components/ui/button";
import { useActorRef, useSelector } from "@/machines/provider";

const MobileNav = lazy(() => import("@/components/mobile-nav"));

export function ConnectedWallet() {
  const address = useSelector(selectWalletAddress);
  const walletType = useSelector(selectWalletType);

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

function ListItemLink({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation();
  const isActive = location.pathname === to || (to === "/" && location.pathname === "/");

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
  const { send } = useActorRef();

  const handleDisconnect = () => {
    send({ type: "DISCONNECT" });
  };

  return (
    <Button id="disconnect-wallet-btn" size="lg" onClick={handleDisconnect}>
      <LogOutIcon size={24} strokeWidth="1.5" />
      Disconnect wallet
    </Button>
  );
}

interface BreadcrumbHandle {
  breadcrumb?: string;
}

function Breadcrumbs() {
  const matches = useMatches();
  const crumbs = matches
    .filter((match) => (match.handle as BreadcrumbHandle | undefined)?.breadcrumb)
    .map((match) => ({
      label: (match.handle as BreadcrumbHandle).breadcrumb as string,
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
                  <BreadcrumbLink asChild>
                    <Link
                      to={item.to}
                      className="rounded-full bg-muted px-4 py-2 font-normal text-foreground"
                    >
                      {item.label}
                    </Link>
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

export default function DashboardLayout() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const location = useLocation();

  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

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
        <Outlet />
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
