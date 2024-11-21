"use client";

import Loader from "@/app/components/Loader";
import Button from "@/app/components/button";
import { useCurrent } from "@/app/lib/current";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { getCsrfToken, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { SiweMessage } from "siwe";
import { sepolia } from "viem/chains";
import { useAccount, useAccountEffect, useSignMessage } from "wagmi";

export default function Wallet() {
  const [error, setError] = useState<string | null>(null);
  const {
    current: { application, loggedIn },
  } = useCurrent();
  const [loading, setLoading] = useState(false);

  const { open } = useWeb3Modal();
  const { signMessageAsync } = useSignMessage();
  const { address, isDisconnected } = useAccount();

  useAccountEffect({
    onConnect(data) {
      if (data.chainId !== sepolia.id) {
        setError("Invalid chain, please switch to sepolia.");
      } else {
        setError(null);
      }
    },
  });

  // biome-ignore lint: correctness/useExhaustiveDependencies
  useEffect(() => {
    // Connect if disconnected
    if (!isDisconnected && !address) open();
  }, []);

  const login = async () => {
    if (loggedIn) return;

    if (!address) return open();

    const message = new SiweMessage({
      domain: window.location.host,
      address: address,
      statement: "Sign in",
      uri: window.location.origin,
      scheme: "https",
      version: "1",
      chainId: sepolia.id,
      nonce: await getCsrfToken(),
    });

    const signature = await signMessageAsync({
      message: message.prepareMessage(),
    });

    signIn("crypto", {
      message: JSON.stringify(message),
      signature,
      callbackUrl: "/steps/kyc",
    });

    setLoading(true);
  };

  if (loading) return <Loader />;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2">
      <h2>Welcome to idOS {application && `in partnership with ${application.client}`}</h2>
      <Button onClick={() => login()}>Login with wallet</Button>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
