import { Image, Tooltip } from "@chakra-ui/react";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type WalletCardProps = {
  address: string;
  isDisabled?: boolean;
  onDelete: (address: string) => void;
};

export const WalletCard = ({ address, isDisabled, onDelete }: WalletCardProps) => {
  return (
    <div className="flex items-center justify-between gap-5 p-5 bg-neutral-900 rounded-xl">
      <div className="flex items-center gap-5">
        <Image src="/idos-dashboard-logo-dark.svg" alt="Wallet image" w={50} h={50} />
        <div className="flex flex-col items-stretch gap-0 overflow-hidden">
          <span className="block text-neutral-600">Address</span>
          <span className="block truncate max-w-[200px]" title={address}>
            {address}
          </span>
        </div>
      </div>
      <Tooltip
        hasArrow
        bg="neutral.500"
        px={2}
        py={0.5}
        rounded="md"
        isDisabled={!isDisabled}
        label="Please connect another wallet to delete this one"
        placement="auto"
      >
        <Button
          variant="secondary"
          disabled={isDisabled}
          id={`delete-wallet-${address}`}
          onClick={() => onDelete(address)}
        >
          <XIcon size={20} />
          Delete
        </Button>
      </Tooltip>
    </div>
  );
};
