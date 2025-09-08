import Logo from "@/assets/idos-logo.svg?url";

export function Header() {
  return (
    <header className="flex flex-col items-center gap-6">
      <span className="text-sm font-medium">idOS Secure Enclave</span>
      <img src={Logo} alt="idOS Secure Enclave" loading="eager" width={114} height={37} />
    </header>
  );
}
