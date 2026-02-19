import { ArrowUpRightFromSquare } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { dashboardActor } from "@/machines/dashboard.actor";

const PRIVACY_POLICY_URL = "https://www.idos.network/legal/privacy-policy";
const TRANSPARENCY_DOCUMENT_URL =
  "https://drive.google.com/file/d/1lzrdgD_dwusE4xsKw_oTUcu8Hq3YU60b/view?usp=sharing";
const LEARN_MORE_URL = "https://docs.idos.network";

export function FacesignDialog() {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [open, setOpen] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          setStep(0);
        }
      }}
    >
      <DialogTrigger
        render={
          <Button className="justify-between" size="xl" variant="secondary">
            Continue with idOS FaceSign
            <img alt="FaceSign" src="/facesign-connect.svg" width={28} height={28} />
          </Button>
        }
      />
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
            <ScrollArea className="max-h-[50vh] w-full">
              <div className="flex flex-col gap-4 pr-2 text-sm leading-relaxed">
                <p className="text-muted-foreground">
                  By proceeding, you explicitly consent to idOS Association processing your
                  biometric data, including facial images and biometric data derived from them, for
                  the purposes of enabling secure authentication and login to idOS through facial
                  recognition; preventing fraud, misuse, and unauthorized access; and conducting
                  manual reviews where automated verification is inconclusive or required for
                  security, compliance, or user support purposes. Your consent includes, in
                  particular, explicit consent to all downstream data processing by all companies
                  named in the Privacy Policy , as well as their sub-processors and controllers who
                  receive personal data or onward transfers from these companies or idOS Association
                  within a data processing chain. You understand that: your biometric data
                  constitutes special category personal data under applicable data protection laws;
                  idOS Association acts as the data controller for this processing; your biometric
                  data will be securely stored in a protected enclave; your facial data may be
                  re-scanned and re-processed each time you choose to authenticate or access idOS
                  services, including for future logins and manual verification processes. You
                  acknowledge that this consent is freely given, specific, informed, and explicit,
                  and that you may withdraw your consent at any time, with effect for the future, as
                  described in the{" "}
                  <a
                    className="text-accent-foreground underline underline-offset-2"
                    href={PRIVACY_POLICY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Privacy Policy
                  </a>{" "}
                  and the{" "}
                  <a
                    className="text-accent-foreground underline underline-offset-2"
                    href={TRANSPARENCY_DOCUMENT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Transparency Document
                  </a>
                  .
                </p>
                <p className="text-white">
                  Withdrawal of consent may limit or prevent your ability to use biometric
                  authentication or access certain idOS features.
                </p>
              </div>
            </ScrollArea>
            <DialogFooter className="justify-center">
              <Button size="lg" className="w-full" onClick={() => setStep(2)}>
                Agree and Continue
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 2 && (
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
            <DialogFooter className="flex-col justify-center gap-3 sm:flex-col">
              <DialogClose
                render={
                  <Button size="lg" className="w-full">
                    Continue on Mobile
                  </Button>
                }
              />
              <Button
                size="lg"
                variant="link"
                className="w-full text-accent-foreground underline"
                onClick={() => {
                  setOpen(false);
                  dashboardActor.send({ type: "CONNECT_FACESIGN" });
                }}
              >
                Continue on this device
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
