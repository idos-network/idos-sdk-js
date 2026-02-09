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
    <div className="flex flex-col items-stretch gap-6 rounded-xl bg-neutral-900 p-5">
      <h1 className="font-medium text-2xl!">{title}</h1>

      {subtitle ? <span className="text-2xl text-neutral-600">{subtitle}</span> : null}

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
