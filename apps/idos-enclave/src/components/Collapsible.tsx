import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/20/solid";
import { useState } from "preact/hooks";

export interface CollapsibleProps {
  title: string;
  Icon?: any;
  children: React.ReactNode;
}

export function Collapsible({ title, Icon, children }: CollapsibleProps) {
  const [open, setOpen] = useState(false);

  const ArrowIcon = open ? ArrowUpIcon : ArrowDownIcon;
  const toggle = () => setOpen(!open);

  return (
    <div className="flex flex-col border-2 border-green-400 rounded-md p-5">
      <div className="flex flex-row cursor-pointer" onClick={toggle}>
        {Icon && <Icon className="h-7 w-7" />}
        <span className="flex-1 text-left px-2 text-xl font-medium">{title}</span>
        <ArrowIcon className="h-7 w-7" />
      </div>
      <div className={`${open ? "block" : "hidden"} text-left mt-3 flex flex-col space-y-4`}>
        {children}
      </div>
    </div>
  );
}
