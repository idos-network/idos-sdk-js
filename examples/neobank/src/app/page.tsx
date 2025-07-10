import Image from "next/image";
import { ConnectWallet } from "@/components/connect-wallet";

export default function Home() {
  return (
    <div className="flex-1 flex-col justify-center bg-neutral-50">
      <main className="p-6">
        <section className="flex h-full flex-col place-content-center items-center gap-6 text-center">
          <h1 className="font-bold text-7xl">
            Welcome to <span className="bg-lime-300 px-2">NeoBank.</span>
          </h1>
          <p className="text-center text-2xl text-neutral-400">
            Your gateway to secure and seamless crypto banking.
          </p>
          <ConnectWallet />
        </section>
      </main>
    </div>
  );
}
