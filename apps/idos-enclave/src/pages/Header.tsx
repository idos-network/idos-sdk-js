import logo from "../assets/idos-logo.svg";

export interface HeaderProps {
  goHome: () => void;
}

export function Header({ goHome }: HeaderProps) {
  return (
    <nav className="bg-neutral-950 shadow-md flex flex-row p-5 items-center justify-between">
      <div onClick={goHome} className="cursor-pointer">
        <img src={logo} alt="idOS Secure Enclave" />
      </div>
      <div className="text-neutral-100 dark:text-neutral-50 text-lg flex flex-row font-semibold">
        Secure Enclave
      </div>
    </nav>
  );
}
