import { ArrowUpRightIcon } from "lucide-react";
import { useIdOS } from "@/idOS.provider";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";

type ProfOfPersonhoodProps = {
  isOpen: boolean;
  onClose: () => void;
};

const fractalProofUrlBase = import.meta.env.VITE_FRACTAL_PROOF_URL_BASE ?? "app.fractal.id";
const fractalProofUrlClientId =
  import.meta.env.VITE_FRACTAL_PROOF_URL_CLIENT_ID ?? "er6XdOOyU_2y8MfKM5pN_fG52l3dVQYIPXBm6Lf4UVc";
const fractalProofUrlRedirectUri =
  import.meta.env.VITE_FRACTAL_PROOF_URL_REDIRECT_URI ?? "https://dashboard.idos.network/success";

const fractalProofUrl = (address: string) => {
  // cspell:disable
  return `https://${fractalProofUrlBase}/authorize?client_id=${fractalProofUrlClientId}&redirect_uri=${encodeURIComponent(
    fractalProofUrlRedirectUri,
  )}&response_type=code&scope=contact%3Aread%20verification.uniqueness%3Aread%20verification.uniqueness.details%3Aread%20verification.idos%3Aread%20verification.idos.details%3Aread&method=wallet&currency=${
    address?.startsWith("0x") ? "eth" : "near"
  }&ensure_wallet=${address}`;
  // cspell:enable
};

export const ProfOfPersonhood = ({ isOpen, onClose }: ProfOfPersonhoodProps) => {
  const idOSClient = useIdOS();

  if (!idOSClient.walletIdentifier) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full max-w-full lg:max-w-[700px]!">
        <DialogHeader className="text-center">
          <DialogTitle>Add Proof of Personhood</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-neutral-700 bg-neutral-800 p-5">
            <img
              src="/flow-1-icon.svg"
              alt="Prove that you are a unique human being"
              className="h-[90px] w-auto max-w-[90px]!"
            />
            <span className="text-neutral-500" role="alert">
              Prove that you are a unique human being
            </span>
          </div>
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-neutral-700 bg-neutral-800 p-5">
            <img
              src="/flow-2-icon.svg"
              alt="It only takes 1 minute!"
              className="h-[90px] w-auto max-w-[90px]!"
            />
            <span className="text-neutral-500" role="alert">
              It only takes 1 minute!
            </span>
          </div>
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-neutral-700 bg-neutral-800 p-5">
            <img
              src="/flow-3-icon.svg"
              alt="Prove it with Fractal ID"
              className="h-[90px] w-auto max-w-[90px]!"
            />
            <span className="text-neutral-500" role="alert">
              Prove it with Fractal ID
            </span>
          </div>
        </div>
        <DialogFooter className="justify-center">
          <Button
            className="flex flex-1 items-center gap-1 lg:flex-none"
            variant="secondary"
            onClick={() => window.location.assign(fractalProofUrl(idOSClient.walletIdentifier))}
          >
            Verify with Fractal ID
            <ArrowUpRightIcon size={24} />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
