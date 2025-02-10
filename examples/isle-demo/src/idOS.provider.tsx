import { Center, Spinner, Text } from "@chakra-ui/react";
import { type idOS as IdOS, idOS } from "@idos-network/idos-sdk";
import {
  type PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAccount } from "wagmi";

import { useEthersSigner } from "@/wagmi.config";

type IdOSContextType = {
  sdk: IdOS | null;
};

const IDOSContext = createContext<IdOSContextType>({ sdk: null });

export const useIdOS = () => useContext(IDOSContext);

export function IDOSProvider({ children }: PropsWithChildren) {
  const [sdk, setSdk] = useState<IdOS | null>(null);
  const initialised = useRef(false);
  const { address } = useAccount();
  const signer = useEthersSigner();

  const initialise = useCallback(async () => {
    if (initialised.current) return;

    try {
      const _instance = await idOS.init({
        nodeUrl: import.meta.env.VITE_IDOS_NODE_URL,
        enclaveOptions: {
          container: "#idOS-enclave",
        },
      });

      setSdk(_instance);

      const _hasProfile = await _instance.hasProfile(address);

      if (_hasProfile) {
        // @ts-ignore - Known type issue with ethers v6
        await _instance.setSigner("EVM", signer);
      }

      initialised.current = true;
    } catch (error) {
      console.error("Failed to initialize idOS:", error);
      initialised.current = false;
    }
  }, [address, signer]);

  useEffect(() => {
    initialise();
  }, [initialise]);

  if (!sdk) {
    return (
      <Center h="100dvh" flexDirection="column" gap="2">
        <Spinner />
        <Text>Initialising idOS...</Text>
      </Center>
    );
  }

  return <IDOSContext.Provider value={{ sdk }}>{children}</IDOSContext.Provider>;
}
