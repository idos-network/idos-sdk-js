import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type WalletCardProps = {
  address: string;
  isDisabled?: boolean;
  onDelete: (address: string) => void;
};

export const WalletCard = ({ address, isDisabled, onDelete }: WalletCardProps) => {
  return (
    <div className="flex items-center justify-between gap-5 rounded-xl bg-neutral-900 p-5">
      <div className="flex items-center gap-5">
        <img src="/idos-dashboard-logo-dark.svg" alt="idOS Dashboard logo" className="h-12 w-12" />
        <div className="flex flex-col items-stretch gap-0 overflow-hidden">
          <span className="block text-neutral-600">Address</span>
          <span className="block max-w-[200px] truncate" title={address}>
            {address}
          </span>
        </div>
      </div>
      <Tooltip disabled={!isDisabled}>
        <TooltipTrigger render={<span className="inline-block" />}>
          <Button
            disabled={isDisabled}
            variant="secondary"
            id={`delete-wallet-${address}`}
            onClick={() => onDelete(address)}
          >
            <XIcon size={20} />
            Delete
          </Button>
        </TooltipTrigger>
        <TooltipContent
          side="left"
          className="bg-neutral-500"
          arrowClassName="bg-neutral-500 fill-neutral-500"
        >
          Please connect another wallet to delete this one
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
