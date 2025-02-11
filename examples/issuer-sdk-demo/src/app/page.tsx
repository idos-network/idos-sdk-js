"use client";

import { Button, Spinner } from "@heroui/react";
import type { idOS, idOSCredential } from "@idos-network/idos-sdk";
import { useEffect, useRef, useState, useTransition } from "react";
import invariant from "tiny-invariant";
import { useAccount, useSignMessage } from "wagmi";

import {
  createCredentialByPermissionedIssuer,
  createCredentialsByDelegatedWriteGrant,
} from "@/actions";
import { CreateProfile } from "@/components/create-profile";
import { Credentials } from "@/components/credentials";
import { useSdkStore } from "@/stores/sdk";
import { useEthersSigner } from "@/wagmi.config";

export default function Home() {
  const { address, isConnected, isDisconnected } = useAccount();
  const initialised = useRef(false);
  const { setSdk, sdk: clientSDK } = useSdkStore();
  const { signMessageAsync } = useSignMessage();

  const [hasProfile, setHasProfile] = useState(false);
  const signer = useEthersSigner();

  const [isPendingProfileCreation, startProfileCreationTransition] = useTransition();

  const [isPendingCreateCredentialRequest, startCredentialRequestTransition] = useTransition();
  const [isPendingGrantedCreateCredentialRequest, startGrantedCredentialRequestTransition] =
    useTransition();

  const [credentials, setCredentials] = useState<idOSCredential[]>([]);

  useEffect(() => {
    async function initialise() {
      if (!isConnected || !signer || initialised.current) return;

      initialised.current = true;

      try {
        const { idOS } = await import("@idos-network/idos-sdk");
        let _instance: idOS;
        _instance = await idOS.init({
          nodeUrl: process.env.NEXT_PUBLIC_KWIL_NODE_URL,
          enclaveOptions: {
            container: "#idOS",
          },
        });

        // TESTING PURPOSES ONLY
        Object.assign(window, { SDK: _instance });

        const _hasProfile = await _instance.hasProfile(String(address));

        if (!_hasProfile) {
          await _instance.reset();
          _instance = await idOS.init({
            nodeUrl: process.env.NEXT_PUBLIC_KWIL_NODE_URL,
            enclaveOptions: {
              container: "#idOS",
              mode: "new",
            },
          });
        } else {
          // @ts-ignore
          await _instance.setSigner("EVM", signer);
          const _credentials = await _instance.data.list<idOSCredential>("credentials");
          console.log("credentials", _credentials);
          setCredentials(_credentials);
        }
        // @ts-ignore
        window.sdk = _instance;

        setHasProfile(_hasProfile);
        setSdk(_instance);
      } catch (error) {
        console.error("Failed to initialize idOS Client SDK:", error);
        initialised.current = false;
      }
    }

    initialise();
  }, [address, isConnected, signer, setSdk]);

  useEffect(() => {
    if (isDisconnected) {
      setCredentials([]);
      setHasProfile(false);
      clientSDK?.reset().then(() => {
        initialised.current = false;
      });
    }
  }, [isDisconnected, clientSDK]);

  if (!isConnected) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Connect your wallet to continue</p>
      </div>
    );
  }

  if (!initialised.current || !clientSDK) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2">
        <Spinner />
        <p>Initializing...</p>
      </div>
    );
  }

  const handleCreateProfileSuccess = () => {
    startProfileCreationTransition(async () => {
      const _hasProfile = await clientSDK.hasProfile(String(address));
      if (_hasProfile && signer) {
        setHasProfile(_hasProfile);
        // @ts-ignore
        await clientSDK.setSigner("EVM", signer);
        const issuerAddress = process.env.NEXT_PUBLIC_ISSUER_PUBLIC_KEY_HEX;

        invariant(issuerAddress, "`NEXT_PUBLIC_ISSUER_PUBLIC_KEY_HEX` is not set");
      }
    });
  };

  if (!hasProfile) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <h1 className="max-w-screen-sm font-semibold lg:text-lg">
          You don't have a profile in the idOS yet. In order to continue, you need to create one
        </h1>
        <div className="w-full max-w-screen-sm rounded-2xl border p-6 shadow-sm">
          <CreateProfile onSuccess={handleCreateProfileSuccess} />
        </div>
      </div>
    );
  }

  const handleCreateGrantedCredential = () => {
    startGrantedCredentialRequestTransition(async () => {
      const issuerAddress = process.env.NEXT_PUBLIC_ISSUER_PUBLIC_KEY_HEX ?? "";
      const currentTimestamp = Date.now();
      const currentDate = new Date(currentTimestamp);
      const notUsableAfter = new Date(currentTimestamp + 24 * 60 * 60 * 1000);
      const delegatedWriteGrant = {
        owner_wallet_identifier: address as string,
        grantee_wallet_identifier: issuerAddress,
        id: crypto.randomUUID(),
        access_grant_timelock: currentDate.toISOString().replace(/.\d+Z$/g, "Z"),
        not_usable_before: currentDate.toISOString().replace(/.\d+Z$/g, "Z"),
        not_usable_after: notUsableAfter.toISOString().replace(/.\d+Z$/g, "Z"),
      };
      console.log(delegatedWriteGrant);
      const message: string = await clientSDK.data.requestDWGSignature(delegatedWriteGrant);
      const signature = await signMessageAsync({ message });
      console.log(message, signature);

      try {
        await createCredentialsByDelegatedWriteGrant(
          String(clientSDK.auth.currentUser.userId),
          clientSDK.auth.currentUser.currentUserPublicKey as string,
          delegatedWriteGrant.owner_wallet_identifier,
          delegatedWriteGrant.grantee_wallet_identifier,
          delegatedWriteGrant.id,
          delegatedWriteGrant.access_grant_timelock,
          delegatedWriteGrant.not_usable_before,
          delegatedWriteGrant.not_usable_after,
          signature,
        );
        const _credentials = await clientSDK.data.list<idOSCredential>("credentials");
        setCredentials(_credentials);
      } catch (error) {}
    });
  };

  const handleCreateCredential = () => {
    startCredentialRequestTransition(async () => {
      await createCredentialByPermissionedIssuer(
        String(clientSDK.auth.currentUser.userId),
        clientSDK.auth.currentUser.currentUserPublicKey as string,
      );
      const _credentials = await clientSDK.data.list<idOSCredential>("credentials");
      setCredentials(_credentials);
    });
  };

  const onCredentialsRefresh = async () => {
    const _credentials = await clientSDK.data.list<idOSCredential>("credentials");
    setCredentials(_credentials);
  };

  if (isPendingProfileCreation) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2">
        <Spinner />
        <p>Updating your profile with the needed permissions...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6">
      <div className="container max-w-screen-sm">
        <Credentials credentials={credentials} onRefresh={onCredentialsRefresh} />
      </div>
      <div className="flex w-full max-w-screen-sm flex-col items-center justify-center gap-6 py-4">
        <p>Request a credential:</p>
        <div className="flex w-full flex-col items-stretch gap-5">
          <Button
            color="default"
            variant="faded"
            onPress={handleCreateCredential}
            isLoading={isPendingCreateCredentialRequest}
          >
            Via Permissioned Issuer
          </Button>
          <Button
            color="secondary"
            variant="flat"
            onPress={handleCreateGrantedCredential}
            isLoading={isPendingGrantedCreateCredentialRequest}
          >
            Via Write Grant
          </Button>
        </div>
      </div>
    </div>
  );
}
