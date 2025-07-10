import Link from "next/link";
import { VisibilityIcon } from "@/components/icons";
import { KycProgressBar } from "@/components/kyc-progress-bar";
import { Button } from "@/components/ui/button";

const Disclaimer = () => (
  <div className="mt-6 flex items-center justify-center">
    <div className="mx-auto max-w-2xl space-y-12 text-center">
      <h1 className="font-medium text-black text-xl md:text-2xl">IdentityVerifier</h1>

      <div className="mx-auto w-full max-w-[415px] font-medium">
        <p className="mb-3">
          You're about to submit mock sensitive data to our mock identity verification provider,
          IdentityVerifier.
        </p>

        <div className="">
          <p>
            By confirming, you agree to the{" "}
            <Link href="#" className="underline transition-all duration-200 hover:no-underline">
              Users' Agreement
            </Link>
            , and confirm you've read the{" "}
            <Link href="#" className="underline transition-all duration-200 hover:no-underline">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link href="#" className="underline transition-all duration-200 hover:no-underline">
              Transparency Document
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  </div>
);

export default function KycFlow() {
  return (
    <div className="mx-auto flex w-full max-w-[1220px] flex-1 rounded-[40px] bg-secondary p-11">
      <div className="mx-auto flex w-full flex-1 flex-col items-center justify-center">
        <div className="flex h-[100px] w-[100px] items-center justify-center rounded-md bg-[#445DF4]">
          <VisibilityIcon />
        </div>
        <Disclaimer />
        <Button className="mt-12 min-h-12 rounded-full bg-black px-12 text-white">Continue</Button>
        <div className="mt-auto flex w-full justify-center">
          <KycProgressBar />
        </div>
      </div>
    </div>
  );
}
