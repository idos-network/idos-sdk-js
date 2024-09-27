import logo from "../assets/idos-logo.svg";

export interface HeaderProps {
  onClick?: () => void;
}

export function Header({ onClick }: HeaderProps) {
  return (
    <nav className="flex flex-row items-center justify-between bg-neutral-950 p-5 shadow-md">
      <button type="button" onClick={onClick} className="cursor-pointer border-none bg-transparent">
        <img src={logo} alt="idOS Secure Enclave" />
      </button>
      <div className="flex flex-row font-semibold text-lg text-neutral-100 dark:text-neutral-50">
        Secure Enclave
      </div>
    </nav>
  );
}
