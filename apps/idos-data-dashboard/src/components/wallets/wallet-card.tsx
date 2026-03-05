import type { WalletType } from "@idos-network/kwil-infra/actions";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface WalletCardProps {
  address: string;
  walletType?: WalletType;
  isDisabled?: boolean;
  onDelete: (address: string) => void;
}

export function WalletCard({ address, walletType, isDisabled, onDelete }: WalletCardProps) {
  return (
    <div className="flex items-center justify-between gap-5 rounded-xl bg-card p-5">
      <div className="flex items-center gap-5">
        {walletType === "FaceSign" ? (
          <img
            src="/facesign-filled.svg"
            alt="FaceSign wallet"
            width={36}
            height={36}
            className="h-9 w-9"
          />
        ) : (
          <>
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
          </>
        )}
        <div className="flex flex-col items-stretch gap-0 overflow-hidden">
          <span className="block text-muted-foreground">Address</span>
          <div className="flex items-center gap-2">
            <span className="block" title={address}>
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
            {walletType === "FaceSign" && (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-transparent bg-emerald-100 px-2.5 py-1 text-emerald-700 text-xs dark:bg-primary/20 dark:text-primary">
                <img src="/facesign-filled.svg" alt="" width={16} height={16} />
                idOS FaceSign
              </span>
            )}
          </div>
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
