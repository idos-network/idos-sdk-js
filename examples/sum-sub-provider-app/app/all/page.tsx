"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { parse } from "uri-template";
import Button from "../components/Button";

const LEVELS = ["basic+liveness", "plus+liveness"];

const authLink = (items: Record<string, string | null>) => {
  const authTemplate = parse(
    `${window.location.origin}{?level,redirect_uri,client,public_encryption_key,grantee}`,
  );

  return authTemplate.expand(items);
};

export default function All() {
  const router = useRouter();

  const [client, setClient] = useState<string>("Superapp!");
  const [level, setLevel] = useState<string>("basic+liveness");
  const [redirectUri, setRedirectUri] = useState<string>("https://google.com/");
  const [publicEncryptionKey, setPublicEncryptionKey] = useState<string | null>(null);
  const [grantee, setGrantee] = useState<string | null>(null);

  const [link, setLink] = useState<string | null>(null);

  useEffect(() => {
    const link = authLink({
      client,
      level,
      redirect_uri: redirectUri,
      public_encryption_key: publicEncryptionKey,
      grantee,
    });
    setLink(link);
  }, [client, level, redirectUri, publicEncryptionKey, grantee]);

  const changeLevel = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLevel(e.target.value);
  }, []);

  return (
    <div className="p-5 bg-slate-400 h-full">
      <h1 className="text-2xl mb-3">Link builder</h1>

      <h2 className="mb-2">KYC Level</h2>

      <div className="flex flex-col gap-1 mb-2">
        {LEVELS.map((l) => (
          <label key={l} className="block cursor-pointer text-sm">
            <input
              type="radio"
              name="level"
              className="mr-1"
              value={l}
              checked={level === l}
              onChange={changeLevel}
            />
            {l}
          </label>
        ))}
      </div>

      <h2 className="mb-2">Client name</h2>

      <input
        type="text"
        className="py-2 px-4 w-2/5 mb-3 bg-white"
        value={client ?? ""}
        onChange={(e) => setClient(e.target.value)}
      />

      <h2 className="mb-2">Redirect URI</h2>

      <input
        type="text"
        className="py-2 px-4 w-2/5 mb-3 bg-white"
        value={redirectUri ?? ""}
        onChange={(e) => setRedirectUri(e.target.value)}
      />

      <h2 className="mb-2">Grantee DAG - address</h2>

      <input
        type="text"
        className="py-2 px-4 w-2/5 mb-3 bg-white"
        value={grantee ?? ""}
        onChange={(e) => setGrantee(e.target.value)}
      />

      <h2 className="mb-2">Grantee DAG - Public encryption key</h2>

      <input
        type="text"
        className="py-2 px-4 w-2/5 mb-3 bg-white"
        value={publicEncryptionKey ?? ""}
        onChange={(e) => setPublicEncryptionKey(e.target.value)}
      />

      <h2 className="mb-3">Generated URL</h2>

      <textarea
        className="mb-2 border-2 border-gray-400 overflow-auto cursor-default block bg-white"
        disabled={true}
        rows={6}
        cols={160}
        value={link ?? ""}
      />

      <div className="flex flex-row gap-2 align-middle">
        <Button onClick={() => (link ? router.push(link) : "")}>Continue</Button>
        <div className="inline-block mb-3 mt-5">or</div>
        <Button
          onClick={() => {
            window.navigator.clipboard.writeText(link ?? "");
          }}
        >
          Copy to clipboard
        </Button>
      </div>
    </div>
  );
}
