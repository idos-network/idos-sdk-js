import {
  ArrowUpRightFromSquare,
  CircleDollarSignIcon,
  ClockIcon,
  CodeSquareIcon,
  CogIcon,
  ExternalLinkIcon,
  LogOutIcon,
  MenuIcon,
  SendIcon,
  Share2Icon,
  ShieldCheckIcon,
  Wallet2Icon,
} from "lucide-react";
import { Fragment, lazy, Suspense, useEffect } from "react";
import { Link, Outlet, useLocation, useMatches, useNavigation } from "react-router";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button, buttonVariants } from "@/components/ui/button";
import useDisclosure from "@/hooks/use-disclosure";
import { cn } from "@/lib/utils";
import { useActorRef, useSelector } from "@/machines/dashboard/provider";
import { selectWalletAddress, selectWalletType } from "@/machines/dashboard/selectors";

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
      <div className="bg-muted flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-lg">
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
              className="hidden h-12.5 w-12.5 dark:block"
              loading="eager"
            />
          </>
        )}
      </div>
      <div>
        <div className="text-card-foreground">
          {isFaceSign ? "idOS FaceSign" : "Connected Wallet"}
        </div>
        <code className="text-muted-foreground max-w-[180px] truncate">
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
    <div className="flex flex-col gap-5">
      <ul className="flex flex-col gap-1.5">
        <li>
          <ListItemLink to="/">
            <ShieldCheckIcon size={24} strokeWidth="1.5" />
            <span>My Data</span>
          </ListItemLink>
        </li>
        <li>
          <ListItemLink to="/shared-with-me">
            <Share2Icon size={24} strokeWidth="1.5" />
            <span>Shared with me</span>
          </ListItemLink>
        </li>
        <li>
          <ListItemLink to="/shared-with-others">
            <SendIcon size={24} strokeWidth="1.5" />
            <span>Shared with others</span>
          </ListItemLink>
        </li>
        <li>
          <ListItemLink to="/wallets">
            <Wallet2Icon size={24} strokeWidth="1.5" />
            <span>Wallets</span>
          </ListItemLink>
        </li>
      </ul>
      <div>
        <h3 className="text-muted-foreground mb-1.5 px-6 text-xs font-semibold tracking-wider uppercase">
          idOS Portal
        </h3>
        <ul className="flex flex-col gap-1.5">
          <li>
            <a
              href="https://portal.idos.network/staking"
              className={externalLinkClasses}
              target="_blank"
              rel="noopener noreferrer"
            >
              <CircleDollarSignIcon size={24} strokeWidth="1.5" />
              <span>Staking</span>
              <ArrowUpRightFromSquare size={16} strokeWidth="1.5" className="ml-auto" />
            </a>
          </li>
          <li>
            <a
              href="https://portal.idos.network/claiming"
              className={externalLinkClasses}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ClockIcon size={24} strokeWidth="1.5" />
              <span>Claims</span>
              <ArrowUpRightFromSquare size={16} strokeWidth="1.5" className="ml-auto" />
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}

export function FooterNavLinks() {
  return (
    <ul className="flex flex-1 flex-col gap-1.5">
      <li>
        <ListItemLink to="/developer">
          <CodeSquareIcon size={24} strokeWidth="1" />
          <span>Developer console</span>
        </ListItemLink>
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

export function LegalLinks() {
  return (
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
                  <BreadcrumbLink
                    className="bg-muted text-foreground rounded-full px-4 py-2 font-normal"
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

function NavigationProgress() {
  const navigation = useNavigation();
  if (navigation.state !== "loading") return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 h-1">
      <div className="bg-primary h-full origin-left animate-[progress_2s_ease-out_forwards]" />
    </div>
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
      <NavigationProgress />
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
            <div className="bg-card rounded-xl px-5">
              <ConnectedWallet />
            </div>
            <div className="bg-card flex flex-1 flex-col items-stretch rounded-xl p-5">
              <MainNavLinks />
              <div className="mt-auto flex flex-col items-stretch gap-5">
                <FooterNavLinks />
                <DisconnectButton />
                <LegalLinks />
              </div>
            </div>
          </div>
        </div>
      </nav>
      <div className="flex min-w-0 flex-1 flex-col items-stretch gap-5 p-5 lg:pl-0">
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
    </div>
  );
}
