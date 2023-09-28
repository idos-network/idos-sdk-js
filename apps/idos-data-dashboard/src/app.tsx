import { Box } from "@chakra-ui/react";
import dayjs from "dayjs";
import { useAtomValue } from "jotai";
import { useMetaMask } from "metamask-react";
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useEffectOnce, useLocalStorage, useSessionStorage } from "usehooks-ts";

import { ConnectWallet } from "@/lib/components/connect-wallet";
import { Header } from "@/lib/components/header";
import { Loading } from "@/lib/components/loading";
import { PasswordForm, PasswordFormValues } from "@/lib/components/password-form";
import { deriveKeyPairEnc, encodeBase64 } from "@/lib/encryption";
import { IDOS_KEYS, StoredCredentials } from "@/lib/hooks";
import { setupMetamask } from "@/lib/metamask";
import { useHumanIdMutation } from "@/lib/mutations";
import { setupNear, useNearSignedIn } from "@/lib/near";
import { publicKeyAtom, setupStoreValues, signerAtom } from "@/lib/store";

export default function App() {
  const metamask = useMetaMask();
  const isNearSignedIn = useNearSignedIn();
  const [isLoading, setIsLoading] = useState(true);
  const publicKey = useAtomValue(publicKeyAtom);
  const isSignedIn = metamask.status === "connected" || isNearSignedIn;
  const [sessionValue, setSessionValue] = useSessionStorage(IDOS_KEYS, "");
  const [storageValue, setStorageValue] = useLocalStorage(IDOS_KEYS, "");
  const hasKeysDefined = !!sessionValue || !!storageValue;
  const signer = useAtomValue(signerAtom);
  const humanId = useHumanIdMutation();

  useEffectOnce(() => {
    if (storageValue) {
      const { expiresAt } = JSON.parse(storageValue);
      if (expiresAt && dayjs().isAfter(expiresAt)) {
        setStorageValue("");
      }
    }
  });

  useEffect(() => {
    async function setup() {
      if (metamask.status === "connected") {
        const { publicKey, signer } = await setupMetamask();
        setupStoreValues(signer, publicKey, metamask.account);
        return;
      }

      if (isNearSignedIn && hasKeysDefined) {
        const { publicKey, signer, accountId } = await setupNear(
          sessionValue ? JSON.parse(sessionValue).password : JSON.parse(sessionValue).password
        );
        setupStoreValues(signer, publicKey, accountId);
      }
    }
    setup().then(() => setIsLoading(false));
  }, [metamask, isNearSignedIn, sessionValue, storageValue, hasKeysDefined]);

  const onPasswordSubmit = async (values: PasswordFormValues) => {
    if (isNearSignedIn) {
      const { publicKey, signer, accountId } = await setupNear(values.password);
      setupStoreValues(signer, publicKey, accountId);
    }

    humanId.mutate(undefined, {
      async onSuccess(humanId) {
        const derived = await deriveKeyPairEnc(values.password, humanId);
        const credentials: StoredCredentials = {
          password: values.password,
          secretKey: encodeBase64(derived.secretKey),
          publicKey: encodeBase64(derived.publicKey),
        };

        if (values.remember === "session") {
          setSessionValue(JSON.stringify(credentials));
          return;
        }

        setStorageValue(
          JSON.stringify({
            ...credentials,
            expiresAt: dayjs().add(1, values.remember).toISOString(),
          })
        );
      },
    });
  };

  if (isLoading) {
    return (
      <Box minH="100vh">
        <Loading />
      </Box>
    );
  }

  if (!isSignedIn) {
    return (
      <Box my={20}>
        <ConnectWallet />
      </Box>
    );
  }

  if (!hasKeysDefined) {
    return (
      <>
        <Header />
        <Box maxW="container.xl" mx="auto" my={20}>
          <PasswordForm onSubmit={onPasswordSubmit} />
        </Box>
      </>
    );
  }

  if (isSignedIn && (!signer || !publicKey)) {
    return (
      <Box minH="100vh">
        <Loading />
      </Box>
    );
  }

  return (
    <Box minH="100vh">
      <Header />
      <Box maxW="container.xl" mx="auto" p={6}>
        <Box my={20}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
