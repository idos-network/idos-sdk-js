import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface WalletCardProps {
  address: string;
  isDisabled?: boolean;
  onDelete: (address: string) => void;
}

export function WalletCard({ address, isDisabled, onDelete }: WalletCardProps) {
  return (
    <div className="flex items-center justify-between gap-5 rounded-xl bg-card p-5">
      <div className="flex items-center gap-5">
        <img
          src="/wallet-light.svg"
          alt="Wallet logo"
          width={48}
          height={48}
          className="h-12 w-12 dark:hidden"
        />
        <img
          src="/wallet.svg"
          alt="Wallet logo"
          width={48}
          height={48}
          className="hidden h-12 w-12 dark:block"
        />
        <div className="flex flex-col items-stretch gap-0 overflow-hidden">
          <span className="block text-muted-foreground">Address</span>
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
          className="bg-muted-foreground"
          arrowClassName="bg-muted-foreground fill-muted-foreground"
        >
          Please connect another wallet to delete this one
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
