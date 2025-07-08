import Image from "next/image";
import Link from "next/link";
import { ConnectWallet } from "@/components/connect-wallet";

export default function Home() {
  return (
    <div className="grid h-screen grid-rows-[auto_1fr_auto] bg-neutral-50">
      <header className="flex h-40 place-content-center items-center">
        <Link href="/">
          <Image src="/logo.svg" alt="NeoBank" width={238} height={41} />
        </Link>
      </header>
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
      <footer className="flex h-20 items-center justify-center p-5 text-center">
        <p className="gap-1 text-neutral-400 text-sm">
          Your account is powered by
          <Image src="/idOS.svg" alt="idOS" width={20} height={20} className="mx-1 inline-block" />
          <span className="font-semibold text-neutral-950">idOS</span>, ensuring all your data is
          encrypted and controlled by you.
        </p>
      </footer>
    </div>
  );
}
