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
    <div className="mr-2 ml-2 flex flex-col rounded-md border-2 border-green-400 p-3">
      <div className="flex cursor-pointer flex-row" onClick={toggle}>
        {Icon && <Icon className="h-7 w-7" />}
        <span className="flex-1 px-2 text-left font-medium text-lg">{title}</span>
        <ArrowIcon className="h-7 w-7" />
      </div>
      <div className={`${open ? "block" : "hidden"} text-left mt-3 flex flex-col space-y-4`}>
        {children}
      </div>
    </div>
  );
}
