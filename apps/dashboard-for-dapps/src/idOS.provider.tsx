import { Center, Spinner, Text } from "@chakra-ui/react";
import { idOS } from "@idos-network/idos-sdk";
import {
  type PropsWithChildren,
  createContext,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAccount } from "wagmi";
import { useEthersSigner } from "./wagmi.config";

// biome-ignore lint/style/noNonNullAssertion: because it's initialized in the provider.
export const IDOSContext = createContext<idOS>(null!);
export const useIdOS = () => use(IDOSContext);

export function IDOSProvider({ children }: PropsWithChildren) {
  const [sdk, setSdk] = useState<idOS | null>(null);
  const initialized = useRef(false);

  const { address } = useAccount();
  const signer = useEthersSigner();

  const initialize = useCallback(async () => {
    if (initialized.current) return;

    if (!signer) return;

    initialized.current = true;

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
    initialize();
  }, [initialize]);

  if (!sdk) {
    return (
      <Center h="100%" flexDirection="column" gap="2">
        <Spinner />
        <Text>initializing idOS...</Text>
      </Center>
    );
  }

  return <IDOSContext value={sdk}>{children}</IDOSContext>;
}
