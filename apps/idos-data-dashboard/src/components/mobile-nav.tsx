import { XIcon } from "lucide-react";
import { Link } from "react-router";

import {
  ConnectedWallet,
  DisconnectButton,
  FooterNavLinks,
  LegalLinks,
  MainNavLinks,
} from "@/layouts/dashboard";

import { Button } from "./ui/button";
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
          <LegalLinks />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
