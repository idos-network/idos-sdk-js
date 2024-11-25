"use client";

import Loader from "@/app/components/Loader";
import { updateIdosData } from "@/app/lib/api";
import { CurrentContext } from "@/app/lib/current";
import { idosPublicKey } from "@/app/lib/idos/frontend";
import { useContext, useEffect, useRef, useState } from "react";

export default function Wallet() {
  const { current, update } = useContext(CurrentContext);
  const created = useRef(false);
  const [loading, setLoading] = useState(false);
  const [key, setKey] = useState<string | null>(null);

  useEffect(() => {
    if (created.current) return;
    created.current = true;

    idosPublicKey({ current, usePasskeys: true }).then((publicKey) => setKey(publicKey));

    // Don't remove the loading, because the user will be moved
    // to the next step.
  }, [current]);

  useEffect(() => {
    if (!key) return;
    setLoading(true);
    updateIdosData({ idosPubKey: key }).then(update);
  }, [key]);

  if (loading) return <Loader />;

  return (
    <div className="flex items-center justify-center h-full flex-col gap-2">
      <h2>Create your idOS password and agree with T&C</h2>
      <div id="idos-container" />
    </div>
  );
}
