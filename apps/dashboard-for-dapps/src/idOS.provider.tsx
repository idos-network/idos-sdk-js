import { Center, Spinner, Text } from "@chakra-ui/react";
import { idOS } from "@idos-network/idos-sdk";
import {
  type PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAccount } from "wagmi";
import { useWalletSelector } from "./contexts/near";
import { useEthersSigner } from "./wagmi.config";

// biome-ignore lint/style/noNonNullAssertion: because it's initialised in the provider.
export const idOSContext = createContext<idOS>(null!);
export const useIdOS = () => useContext(idOSContext);

export function Provider({ children }: PropsWithChildren) {
  const [sdk, setSdk] = useState<idOS | null>(null);
  const initialised = useRef(false);
  const { accountId, selector } = useWalletSelector();
  const { address: ethAddress } = useAccount();
  const ethSigner = useEthersSigner();

  const userAddress = useMemo(() => accountId ?? ethAddress, [accountId, ethAddress]);

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
    initialised.current = true;

    const _instance = await idOS.init({
      nodeUrl: "https://nodes.staging.idos.network",
      enclaveOptions: {
        container: "#idOS-enclave",
      },
      evmGrantsOptions: {
        contractAddress: "0x827310fF816EfD65406a40cb1358cc82Bc2F5cF9",
      },
    });

    setSdk(_instance);
    const _hasProfile = await _instance.hasProfile(userAddress as string);

    if (_hasProfile && ethSigner) {
      // @ts-expect-error
      await _instance.setSigner(signer.type, signer.value);
    }
  }, [userAddress, getSigner]);

  useEffect(() => {
    initialise();
  }, [initialise]);

  if (!sdk) {
    return (
      <Center h="100%" flexDirection="column" gap="2">
        <Spinner />
        <Text>Initialising idOS...</Text>
      </Center>
    );
  }

  return <idOSContext.Provider value={sdk}>{children}</idOSContext.Provider>;
}
