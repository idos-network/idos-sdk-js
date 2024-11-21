"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Loader from "../components/Loader";
import { init } from "../lib/api";

export default function InitScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  // biome-ignore lint: lint/style/noNonNullAssertion
  const client = params.get("client")!;
  // biome-ignore lint: lint/style/noNonNullAssertion
  const level = params.get("level")!;
  // biome-ignore lint: lint/style/noNonNullAssertion
  const redirectUri = params.get("redirect_uri")!;
  // biome-ignore lint: lint/style/noNonNullAssertion
  const publicEncryptionKey = params.get("public_encryption_key")!;
  // biome-ignore lint: lint/style/noNonNullAssertion
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
      <div className="flex h-full items-center justify-center">
        <div className="rounded-md border-2 border-orange-600 px-1 py-4">
          <h1 className="w-full text-center font-bold text-orange-600">Error</h1>
          <p className="px-4 py-1">{error}</p>
        </div>
      </div>
    );
  }

  return <Loader />;
}
