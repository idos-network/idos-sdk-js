import { ArrowRight, Building2, Wallet } from "lucide-react";
import type { Route } from "./+types/send";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "NeoFinance | idOS Demo" }];
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

export default function Send() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-2xl text-foreground tracking-tight">Send Funds</h2>
          <p className="text-muted-foreground text-sm">Choose how you would like to send money.</p>
        </div>
      </div>

      <div className="mx-auto grid max-w-2xl gap-6 md:grid-cols-2">
        <Card className="cursor-pointer transition-all hover:border-input hover:shadow-md">
          <CardHeader className="pb-4">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-info/10 text-info-foreground">
              <Wallet className="h-6 w-6" />
            </div>
            <CardTitle>Send Crypto</CardTitle>
            <CardDescription>Transfer digital assets to another wallet address.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center font-medium text-info-foreground text-sm">
              Continue <ArrowRight className="ml-1 h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-all hover:border-input hover:shadow-md">
          <CardHeader className="pb-4">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success-foreground">
              <Building2 className="h-6 w-6" />
            </div>
            <CardTitle>Send to Bank Account</CardTitle>
            <CardDescription>Withdraw funds directly to a bank account via Noah.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center font-medium text-sm text-success-foreground">
              Continue <ArrowRight className="ml-1 h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
