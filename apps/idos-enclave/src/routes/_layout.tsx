import type { PropsWithChildren } from "preact/compat";
import { Link } from "wouter-preact";

function Header() {
  return (
    <nav className="flex flex-row items-center justify-between bg-neutral-950 p-6 shadow-md">
      <Link to="/auth" className="cursor-pointer border-none bg-transparent">
        <img src="/idOS-logo.svg" alt="idOS Secure Enclave" width={68} height={22} />
      </Link>
      <p className="font-semibold text-lg text-neutral-100 dark:text-neutral-50">Secure Enclave</p>
    </nav>
  );
}

export function Layout({ children }: PropsWithChildren) {
  return (
    <>
      <Header />
      <main class="mx-auto max-w-screen-md p-6">
        <div class="mx-auto w-[30rem]">{children}</div>
      </main>
    </>
  );
}
