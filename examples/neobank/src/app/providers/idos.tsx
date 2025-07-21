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

  useEffect(() => {
    if (!isConnected || loggedInClient?.user.id) return;
    if (!kycCompleted) return; // in case of kyc completion re-check user's profile

    const initialize = async () => {
      if (singer) {
        await initializeClient(singer);
        await login();
        await checkProfile();
      }
    };
    initialize();
  }, [singer, initializeClient, login, checkProfile, isConnected, kycCompleted, loggedInClient]);

  useEffect(() => {
    if (!loggedInClient?.user.id) return;
    findSharedCredential(loggedInClient.user.id);
  }, [loggedInClient, findSharedCredential]);

  return (
    <div className="relative h-full w-[200px] self-center">
      <div id="idOS-enclave" />
    </div>
  );
}
