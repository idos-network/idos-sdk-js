import { useWalletChooser } from "@idos-network/wallets";
import { useCallback, useEffect } from "react";

export function Welcome() {
  const { connect, selectedWallet, wallets } = useWalletChooser();

  const signIn = useCallback(async () => {
    /*if (selectedWallet) {
      // Start SIWE
      const authResponse = await fetch(
        `/auth?address=${selectedWallet.address}&chain=${selectedWallet.chain}&publicKey=${selectedWallet.publicKey}`,
      );
      const { user } = await authResponse.json();

      const signature = await selectedWallet.signMessage(user.message);

      const signInResponse = await fetch("/auth", {
        method: "POST",
        body: JSON.stringify({
          signature,
          address: selectedWallet.address,
          publicKey: selectedWallet.publicKey,
        }),
      });

      if (signInResponse.redirected) {
        window.location.href = signInResponse.url;
      }
      return;
    }*/
  }, [selectedWallet]);

  useEffect(() => {
    if (selectedWallet) {
      signIn();
    }
  }, [selectedWallet, signIn]);

  const walletsList = wallets.map((x) => (
    <div key={`${x.chain}-${x.chain}`}>
      {x.chain} ({x.chain}) - {x.address} - {x.publicKey}
      <button onClick={() => x.signMessage("Hello")} type="button" className="bg-blue-500 text-white px-4 py-2 rounded-md">Sign</button>
    </div>
  ));

  return (
    <main className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-950">
      <div className="flex flex-col items-center gap-8 p-8">
        <header className="flex flex-col items-center gap-6">
          <h1 className="text-center font-bold text-3xl text-gray-900 dark:text-white">
            Welcome to Foxy Demo
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-300">
            Get started by logging in to your account
          </p>
        </header>

{walletsList}

        <button
          type="button"
          className="cursor-pointer rounded-lg bg-blue-600 px-8 py-4 font-semibold text-lg text-white transition-colors hover:bg-blue-700"
          onClick={() => connect()}
        >
          add a wallet
        </button>
      </div>
    </main>
  );
}
