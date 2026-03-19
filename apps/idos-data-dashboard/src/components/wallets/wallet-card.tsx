import type { WalletType } from "@idos-network/kwil-infra/actions";

import { LockIcon, Trash2Icon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const CHAIN_LABEL: Record<string, string> = {
  EVM: "ETH",
  NEAR: "NEAR",
  XRPL: "XRP",
  Stellar: "XLM",
};

const DISPLAY_NAME: Record<string, string> = {
  EVM: "EVM Wallet",
  NEAR: "Near Wallet",
  XRPL: "XRP Wallet",
  Stellar: "Stellar Wallet",
  FaceSign: "idOS FaceSign",
};

function truncateAddress(addr: string): string {
  if (addr.length <= 30) return addr;
  return `${addr.slice(0, 16)}...${addr.slice(-10)}`;
}

interface WalletCardProps {
  address: string;
  walletType?: WalletType;
  isDisabled?: boolean;
  onDelete: (address: string) => void;
}

export function WalletCard({ address, walletType, isDisabled, onDelete }: WalletCardProps) {
  const isFaceSign = walletType === "FaceSign";
  const chainLabel = walletType ? CHAIN_LABEL[walletType] : null;
  const displayName = walletType ? (DISPLAY_NAME[walletType] ?? "Wallet") : "Wallet";

  return (
    <div className="bg-card flex w-full flex-col gap-4 rounded-xl border p-5">
      <div className="flex items-center gap-3">
        {isFaceSign ? (
          <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
            <img
              src="/facesign-filled.svg"
              alt="FaceSign wallet"
              width={24}
              height={24}
              className="size-6"
            />
          </div>
        ) : (
          <div className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-lg text-xs font-semibold">
            {chainLabel}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold" title={address}>
            {truncateAddress(address)}
          </p>
          <p className="text-muted-foreground text-sm">{displayName}</p>
        </div>
        {isFaceSign && (
          <Badge variant="default" className="shrink-0">
            FaceSign
          </Badge>
        )}
        {isDisabled && (
          <Badge variant="success" className="shrink-0">
            Connected
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isDisabled ? (
          <Button variant="secondary" disabled>
            <LockIcon size={16} />
            Currently connected
          </Button>
        ) : (
          <Button
            variant="destructive"
            id={`delete-wallet-${address}`}
            aria-label={`Remove wallet ${address}`}
            onClick={() => onDelete(address)}
          >
            <Trash2Icon size={16} />
            Remove wallet
          </Button>
        )}
      </div>
    </div>
  );
}
