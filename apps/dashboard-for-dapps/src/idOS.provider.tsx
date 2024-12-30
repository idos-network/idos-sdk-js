import { Center, Spinner, Text } from "@chakra-ui/react";
import { idOS } from "@idos-network/idos-sdk";
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
import { useEthersSigner } from "./wagmi.config";

// biome-ignore lint/style/noNonNullAssertion: because it's initialised in the provider.
export const idOSContext = createContext<idOS>(null!);
export const useIdOS = () => useContext(idOSContext);

export function Provider({ children }: PropsWithChildren) {
  const [sdk, setSdk] = useState<idOS | null>(null);
  const initialised = useRef(false);

  const { address } = useAccount();
  const signer = useEthersSigner();

  const initialise = useCallback(async () => {
    if (initialised.current) return;

    if (!signer) return;

    initialised.current = true;

    const _instance = await idOS.init({
      nodeUrl: import.meta.env.VITE_IDOS_NODE_URL,
      enclaveOptions: {
        container: "#idOS-enclave",
        url: import.meta.env.VITE_IDOS_ENCLAVE_URL,
      },
    });

    setSdk(_instance);
    const _hasProfile = await _instance.hasProfile(address as string);

    if (_hasProfile && signer) {
      // @ts-ignore
      await _instance.setSigner("EVM", signer);
    }
  }, [address, signer]);

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
