"use client";

import Loader from "@/app/components/Loader";
import Button from "@/app/components/button";
import { updateIdosData } from "@/app/lib/api";
import { useCurrent } from "@/app/lib/current";
import { useEffect, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";

interface MessageParameters {
  owner: string;
  dataId: string;
  grantee: string;
  lockedUntil: bigint;
}

const insertGrantBySignatureMessage = ({
  owner,
  grantee,
  dataId,
  lockedUntil,
}: MessageParameters): string => {
  return [
    "operation: insertGrant",
    `owner: ${owner.toLowerCase()}`,
    `grantee: ${grantee.toLowerCase()}`,
    `dataId: ${dataId}`,
    `lockedUntil: ${lockedUntil}`,
  ].join("\n");
};

enum State {
  Init = 0,
  Disconnected = 1,
  Started = 2,
  Signing = 3,
  Done = 4,
  Error = 5,
}

export default function AccessGrantSignature() {
  const {
    current: { application },
    update,
  } = useCurrent();
  const { address, isConnected } = useAccount();
  const { data, signMessageAsync, variables } = useSignMessage();

  const [state, setState] = useState<State>(0);
  const [dataId, setDataId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const lockedUntil = BigInt(0);
  const grantee = application?.grantee;

  const start = () => {
    setState(State.Started);
    setDataId(crypto.randomUUID());
  };

  // biome-ignore lint: correctness/useExhaustiveDependencies
  useEffect(() => {
    if (state === State.Started && isConnected && address && dataId && grantee) {
      setState(State.Signing);

      const message = insertGrantBySignatureMessage({
        owner: address,
        grantee,
        dataId,
        lockedUntil,
      });

      void signMessageAsync({ message });
    }
  }, [isConnected, state, dataId]);

  // biome-ignore lint: correctness/useExhaustiveDependencies
  useEffect(() => {
    if (variables?.message && data && address && state === State.Signing && dataId && grantee) {
      setIsSubmitting(true);

      updateIdosData({
        idosGrantOwner: address,
        idosGrantGrantee: grantee,
        idosGrantDataId: dataId,
        // @ts-expect-error Bigint
        idosGrantLockedUntil: lockedUntil ? Number(lockedUntil) : 0,
        idosGrantMessage: variables.message as string,
        idosGrantSignature: data,
      }).then(update);

      // Don't setSubmitting to false, because the user will be moved
      // to the next step.
    }
  }, [variables, data, state]);

  const inProgress = isSubmitting || state === State.Signing || state === State.Disconnected;

  if (inProgress) return <Loader />;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2">
      {state !== State.Done && (
        <Button onClick={start} disabled={inProgress}>
          Sign & Grant access
        </Button>
      )}
    </div>
  );
}
