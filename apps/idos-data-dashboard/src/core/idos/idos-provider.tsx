import { Center, Spinner } from "@chakra-ui/react";
import { idOS } from "@idos-network/idos-sdk";
import { type PropsWithChildren, useCallback, useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";

import { ConnectWallet } from "@/connect-wallet";
import { useWalletSelector } from "../near";
import { useEthersSigner } from "../wagmi";
import { idOSContext } from "./idos-context";

export const Provider = ({ children }: PropsWithChildren) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [sdk, setSdk] = useState<idOS | null>(null);
  const [publicKey, setPublicKey] = useState<string | undefined>();
  const ethSigner = useEthersSigner();
  const { accountId, accounts, selector } = useWalletSelector();
  const { address: ethAddress, isConnected: isEthConnected } = useAccount();

  const userAddress = useMemo(() => accountId ?? ethAddress, [accountId, ethAddress]);

  const isConnected = useMemo(
    () => accounts.length > 0 || isEthConnected,
    [accounts, isEthConnected],
  );

  const getSigner = useCallback(async () => {
    if (selector.isSignedIn()) {
      return {
        type: "NEAR",
        value: await selector.wallet(),
      };
    }

    if (ethSigner) {
      return {
        type: "EVM",
        value: ethSigner,
      };
    }

    return null;
  }, [ethSigner, selector]);

  const initialise = useCallback(async () => {
    const signer = await getSigner();

    if (!signer || !userAddress || sdk) return;

    const _sdk = await idOS.init({
      nodeUrl: import.meta.env.VITE_IDOS_NODE_URL,
      dbId: import.meta.env.VITE_IDOS_NODE_KWIL_DB_ID,
      enclaveOptions: {
        container: "#idos",
        url: import.meta.env.VITE_IDOS_ENCLAVE_URL,
      },
    });

    const profile = await _sdk.hasProfile(userAddress);
    setHasProfile(profile);

    if (profile) {
      // @ts-expect-error
      await _sdk.setSigner(signer.type, signer.value);
      const _pk = _sdk.auth.currentUser.publicKey;

      setPublicKey(_pk);
    }

    setSdk(_sdk);
  }, [getSigner, userAddress, sdk]);

  useEffect(() => {
    initialise()
      // @todo: display errors in the UI.
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [initialise]);

  useEffect(() => {
    if (!userAddress) {
      setSdk(null);
    }
  }, [userAddress]);

  if (!isConnected) {
    return <ConnectWallet />;
  }

  if (isLoading || !sdk) {
    return (
      <Center h="100dvh">
        <Spinner />
      </Center>
    );
  }

  return (
    <idOSContext.Provider
      value={{
        sdk,
        hasProfile,
        address: userAddress,
        publicKey,
        async reset() {
          await sdk.reset();
        },
      }}
    >
      {children}
    </idOSContext.Provider>
  );
};
