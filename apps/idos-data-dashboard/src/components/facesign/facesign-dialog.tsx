import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";

interface FacesignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
  isLoading?: boolean;
}

export function FacesignDialog({ open, onOpenChange, onContinue, isLoading }: FacesignDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <img
            src="/facesign-logo.svg"
            alt="idOS FaceSign"
            width={130}
            height={60}
            className="mx-auto"
          />
        </DialogHeader>

        <div className="flex flex-col items-center gap-6">
          <div className="relative flex size-48 items-center justify-center">
            <img
              src="/facesign-ring.svg"
              alt=""
              width={192}
              height={192}
              className="absolute inset-0 size-full"
            />
            <img src="/facesign-filled.svg" alt="" width={80} height={80} className="relative" />
          </div>
          <h2 className="text-center text-lg">Scan your Face to Continue</h2>
          <p className="text-center text-muted-foreground text-sm">
            Scan your face to log in with FaceSign or enroll if you’re new.
          </p>
        </div>
        <DialogFooter className="justify-center">
          <Button size="lg" className="w-full" onClick={onContinue} isLoading={isLoading}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}