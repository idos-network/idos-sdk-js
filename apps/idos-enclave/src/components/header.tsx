import Logo from "@/assets/idos-logo.svg?url";

export function Header() {
  return (
    <nav className="flex flex-row items-center justify-between bg-neutral-950 p-5 shadow-md">
      <span>
        <img src={Logo} alt="idOS Secure Enclave" loading="eager" />
      </span>
      <div className="flex flex-row font-semibold text-lg text-neutral-100 dark:text-neutral-50">
        Secure Enclave
      </div>
    </nav>
  );
}
