"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Loader from "../components/Loader";
import { init } from "../lib/api";

export default function InitScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const client = params.get("client")!;
  const level = params.get("level")!;
  const redirectUri = params.get("redirect_uri")!;
  const publicEncryptionKey = params.get("public_encryption_key")!;
  const grantee = params.get("grantee")!;

  useEffect(() => {
    init({ client, level, redirectUri, publicEncryptionKey, grantee }).then((res) => {
      if (res) {
        setError(res);
      } else {
        router.push("/steps/wallet");
      }
    });
  }, [client, level, redirectUri, publicEncryptionKey, router, grantee]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="px-1 py-4 border-2 border-orange-600 rounded-md">
          <h1 className="text-orange-600 text-center w-full font-bold">Error</h1>
          <p className="px-4 py-1">{error}</p>
        </div>
      </div>
    );
  }

  return <Loader />;
}
