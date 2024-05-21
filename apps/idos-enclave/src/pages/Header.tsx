import { MoonIcon, SunIcon } from "@heroicons/react/20/solid";
import logo from "../assets/idos-logo.svg";
import { Theme } from "./App";

export interface HeaderProps {
  theme: Theme;
  toggleTheme: () => void;
  goHome: () => void;
}

export function Header({ theme, toggleTheme, goHome }: HeaderProps) {
  const Icon = theme === "dark" ? SunIcon : MoonIcon;

  return (
    <nav className="bg-neutral-950 shadow-md flex flex-row p-5 items-center justify-between">
      <div onClick={goHome} className="cursor-pointer">
        <img src={logo} alt="idOS Secure Enclave" />
      </div>
      <div className="text-neutral-100 dark:text-neutral-50 text-lg flex flex-row font-semibold">
        <Icon
          className="cursor-pointer -ml-1 h-5 w-5 mr-5 mt-1 text-neutral-50"
          onClick={toggleTheme}
        />
        idOS Secure Enclave
      </div>
    </nav>
  );
}
