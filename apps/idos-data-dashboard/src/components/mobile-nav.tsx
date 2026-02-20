import { Link } from "@tanstack/react-router";
import { ExternalLinkIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConnectedWallet, DisconnectButton, FooterNavLinks, MainNavLinks } from "./layout";
import { Button, buttonVariants } from "./ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader } from "./ui/drawer";

interface MobileNavProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export default function MobileNav({ isOpen, onOpen, onClose }: MobileNavProps) {
  return (
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
              width={120}
              height={39}
              className="h-auto w-[120px] dark:hidden"
              loading="eager"
            />
            <img
              src="/logo.svg"
              alt="idOS logo"
              width={120}
              height={39}
              className="hidden h-auto w-[120px] dark:block"
              loading="eager"
            />
          </Link>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-5">
            <ConnectedWallet />
          </div>
          <MainNavLinks />
        </div>
        <DrawerFooter className="flex-col items-stretch gap-5">
          <FooterNavLinks />

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
  );
}
