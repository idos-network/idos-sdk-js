"use client";

import { useNearWallet } from "@/near.provider";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/react";

import { useAppKit, useAppKitAccount, useDisconnect } from "@reown/appkit/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAccount } from "wagmi";

export function WalletConnector() {
  const { open } = useAppKit();
  const nearWallet = useNearWallet();
  const { disconnect } = useDisconnect();
  const router = useRouter();
  const { isConnected } = useAppKitAccount();
  const { isConnecting } = useAccount();

  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  useEffect(() => {
    if (isConnected) {
      router.replace("/onboarding");
    } else {
      router.replace("/");
    }
  }, [isConnected, router]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: It is fine to subscribe to the observable.
  useEffect(() => {
    const unsubscribe = nearWallet.selector.store.observable.subscribe((result) => {
      if (result.accounts.length > 0) {
        router.replace("/onboarding");
      } else {
        router.replace("/");
      }
    });
    return () => unsubscribe.unsubscribe();
  }, []);

  if (isConnected || nearWallet.selector.isSignedIn()) {
    return (
      <div className="flex items-center gap-4">
        <Button
          color="danger"
          onPress={async () => {
            if (isConnected) {
              disconnect();
              return;
            }
            const wallet = await nearWallet.selector.wallet();
            await wallet.signOut();
          }}
        >
          Disconnect wallet
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button color="secondary" isLoading={isConnecting} onPress={onOpen}>
        Get Started now
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1">Connect your wallet</ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-4">
                  <Button onPress={() => open()}>Connect with Reown</Button>
                  <Button onPress={() => nearWallet.modal.show()}>Connect with NEAR</Button>
                </div>
              </ModalBody>
              <ModalFooter />
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
