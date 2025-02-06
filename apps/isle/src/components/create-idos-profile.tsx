import { useState } from "preact/hooks";

export function CreateIdosProfile({ stepperLine }: { stepperLine: JSX.Element }) {
  const [loading] = useState(false);
  const [success] = useState(false);

  if (loading)
    return (
      <div className="flex flex-col items-center">
        {stepperLine}
        <p className="mx-auto my-8">Loading...</p>
      </div>
    );
  if (success)
    return (
      <div className="mx-auto flex flex-col items-center gap-8">
        <p className="text-center font-semibold text-lg">idOS Profile created.</p>
        <p>Success Icon</p>
      </div>
    );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-center font-semibold text-2xl">Create your idOS Profile.</h1>
      {stepperLine}
      <p className="mx-auto max-w-[220px] text-center font-medium text-neutral-500 text-sm">
        Sign the message in your wallet to authenticate with idOS.
      </p>
      <div className="flex gap-2 rounded-2xl bg-neutral-800 p-4">
        <img src="/lit.svg" alt="lit" />
        <div className="flex flex-col items-start gap-2">
          <p className="text-neutral-500 text-sm">
            If you haven’t previously added this wallet to idOS, a private/public keypair from LIT
            will be created to encrypt your data.
          </p>
          <a
            href="https://developer.litprotocol.com/concepts/pkps-as-wallet#mpc-wallets-with-lit"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary text-sm"
          >
            Learn more about LIT’s MPC encryption.
          </a>
        </div>
      </div>
    </div>
  );
}
