"use client";
import { useAppKitAccount } from "@reown/appkit/react";
import { useEffect } from "react";
import { useEthersSigner } from "@/core/wagmi";
import { useAppStore } from "@/stores/app-store";
import { useIdosStore } from "@/stores/idos-store";

export function IdosProvider() {
  const { isConnected } = useAppKitAccount();
  const singer = useEthersSigner();
  const { initializeClient, login, checkProfile, loggedInClient } = useIdosStore();
  const { findSharedCredential, kycCompleted } = useAppStore();

  // biome-ignore lint/correctness/useExhaustiveDependencies: initializing idos process should be triggered once kycCompleted
  useEffect(() => {
    if (!isConnected || !singer) return;
    const initialize = async () => {
      if (singer) {
        await initializeClient(singer);
        await login();
        await checkProfile();
      }
    };
    initialize();
  }, [singer, initializeClient, login, checkProfile, isConnected, kycCompleted]);

  useEffect(() => {
    if (!loggedInClient?.user.id) return;
    findSharedCredential(loggedInClient.user.id);
  }, [loggedInClient, findSharedCredential]);

  return (
    <div className="absolute bottom-[5%] z-[-1] h-[80px] w-[250px] self-center">
      <div id="idOS-enclave" />
    </div>
  );
}
