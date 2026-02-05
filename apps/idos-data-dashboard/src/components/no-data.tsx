import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import useDisclosure from "@/hooks/useDisclosure";

import { ProfOfPersonhood } from "./proof-of-personhood";

export type NoDataProps = {
  title: string;
  subtitle?: string;
  cta?: string;
};

export const NoData = ({ title, subtitle, cta }: NoDataProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <div className="flex flex-col items-stretch gap-6 p-5 bg-neutral-900 rounded-xl">
      <h1 className="text-2xl! font-medium">{title}</h1>

      {subtitle ? <span className="text-neutral-600 text-2xl">{subtitle}</span> : null}

      {cta ? (
        <div>
          <Button onClick={onOpen}>
            <PlusIcon size={24} />
            {cta}
          </Button>
        </div>
      ) : null}

      <ProfOfPersonhood isOpen={isOpen} onClose={onClose} />
    </div>
  );
};
