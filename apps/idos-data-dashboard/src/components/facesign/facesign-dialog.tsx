import { ArrowUpRightFromSquare } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";

const LEARN_MORE_URL = "https://docs.idos.network";

interface FacesignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
  isLoading?: boolean;
}

export function FacesignDialog({ open, onOpenChange, onContinue, isLoading }: FacesignDialogProps) {
  const [step, setStep] = useState<0 | 1>(0);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (nextOpen) {
          setStep(0);
        }
      }}
    >
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

        {step === 0 && (
          <>
            <div className="flex flex-col items-center gap-8">
              <div className="flex w-full flex-1 flex-col items-center gap-4">
                <img src="/facesign-welcome.png" alt="Facesign" width={292} height={265} />
                <h2 className="text-center text-lg">Welcome</h2>
                <p className="text-center text-muted-foreground">
                  Access starts with trust, and your face.
                </p>
              </div>
            </div>
            <DialogFooter className="justify-center">
              <Button size="lg" className="w-full" onClick={() => setStep(1)}>
                Get started
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 1 && (
          <>
            <div className="flex flex-col items-center gap-6">
              <div className="relative flex size-48 items-center justify-center">
                <img
                  src="/facesign-ring.svg"
                  alt=""
                  width={192}
                  height={192}
                  className="absolute inset-0 size-full"
                />
                <img
                  src="/facesign-filled.svg"
                  alt=""
                  width={80}
                  height={80}
                  className="relative"
                />
              </div>
              <h2 className="text-center text-lg">Scan your Face to Continue</h2>
              <p className="text-center text-muted-foreground text-sm">
                Next, you&apos;ll scan your face to log in with FaceSign or enroll if you&apos;re
                new.
              </p>
              <a
                className="inline-flex items-center gap-1.5 text-primary text-sm underline underline-offset-2"
                href={LEARN_MORE_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Learn More
                <ArrowUpRightFromSquare size={14} />
              </a>
            </div>
            <DialogFooter className="justify-center">
              <Button size="lg" className="w-full" onClick={onContinue} isLoading={isLoading}>
                Continue
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
