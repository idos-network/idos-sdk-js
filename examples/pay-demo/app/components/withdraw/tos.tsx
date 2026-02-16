import { FileText, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "~/components/ui/separator";

interface DueTosProps {
  onAccept: () => void;
  isLoading?: boolean;
  tosUrl?: string;
  privacyPolicyUrl?: string;
}

const DEFAULT_TOS_URL = "https://due.network/terms";
const DEFAULT_PRIVACY_URL = "https://due.network/privacy";

export function DueTos({ onAccept, isLoading = false, tosUrl, privacyPolicyUrl }: DueTosProps) {
  const [accepted, setAccepted] = useState(false);

  return (
    <Card className="mx-auto max-w-2xl gap-5 shadow-sm">
      <CardHeader>
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success-foreground">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <CardTitle>Terms of Service</CardTitle>
        <CardDescription>Review and accept Due's terms to continue</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <ScrollArea className="h-64 rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex flex-col gap-4 pr-3 text-muted-foreground text-sm">
            <p>
              By using Due's services, you agree to the following terms and conditions governing the
              use of our payment platform, including fund transfers to bank accounts.
            </p>

            <div className="flex flex-col gap-2">
              <h4 className="font-medium text-foreground">1. Account Usage</h4>
              <p>
                You agree to provide accurate and complete information during account setup. You are
                responsible for maintaining the security of your account credentials and for all
                activities that occur under your account.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="font-medium text-foreground">2. Fund Transfers</h4>
              <p>
                Due facilitates the transfer of funds from digital assets to traditional bank
                accounts. Transfer times, fees, and availability may vary depending on your region
                and financial institution. Due is not liable for delays caused by third-party
                banking systems.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="font-medium text-foreground">3. KYC and Compliance</h4>
              <p>
                You consent to identity verification procedures as required by applicable
                regulations. Due may share your verification data with regulated partners to
                facilitate compliance with anti-money laundering (AML) and know-your-customer (KYC)
                requirements.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="font-medium text-foreground">4. Privacy Policy</h4>
              <p>
                Your personal data is handled in accordance with Due's Privacy Policy. We collect
                and process only the data necessary to provide our services and comply with legal
                obligations.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="font-medium text-foreground">5. Limitation of Liability</h4>
              <p>
                Due shall not be liable for any indirect, incidental, or consequential damages
                arising from your use of the platform. Our total liability is limited to the fees
                paid by you in the twelve months preceding the claim.
              </p>
            </div>

            <Separator />

            <div className="flex items-center gap-2 text-xs">
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span>
                Full documents available at{" "}
                <a
                  href={tosUrl ?? DEFAULT_TOS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-info-foreground underline underline-offset-2"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href={privacyPolicyUrl ?? DEFAULT_PRIVACY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-info-foreground underline underline-offset-2"
                >
                  Privacy Policy
                </a>
              </span>
            </div>
          </div>
        </ScrollArea>
      </CardContent>

      <Separator />

      <CardFooter className="flex-col gap-4">
        <div className="flex w-full items-start gap-3">
          <Checkbox
            id="due-tos-accept"
            checked={accepted}
            onCheckedChange={(checked) => setAccepted(checked === true)}
            disabled={isLoading}
            className="mt-0.5"
          />
          <label
            htmlFor="due-tos-accept"
            className="cursor-pointer text-muted-foreground text-sm leading-tight"
          >
            I have read and agree to Due's{" "}
            <span className="font-medium text-foreground underline underline-offset-2">
              Terms of Service
            </span>{" "}
            and{" "}
            <span className="font-medium text-foreground underline underline-offset-2">
              Privacy Policy
            </span>
          </label>
        </div>

        <Button className="w-full" size="lg" disabled={!accepted || isLoading} onClick={onAccept}>
          {isLoading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Accepting...
            </>
          ) : (
            "Accept & Continue"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
