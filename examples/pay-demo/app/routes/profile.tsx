import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import type { Route } from "./+types/profile";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "NeoFinance | idOS Demo" }];
}

import { Check, HardDrive, User, Wallet } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";

const ADDRESS = "0x1a2B3c4D5e6F7890abCdEf1234567890AbCdEf12";

export default function Profile() {
  return (
    <div className="flex min-h-full flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Your Profile</h2>
          <p className="text-sm text-muted-foreground">
            Manage your identity and connected wallets
          </p>
        </div>
      </div>

      <div className="mx-auto flex max-w-lg flex-col gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Identity Status</CardTitle>
            <CardDescription>Your verified identity credentials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-success/10 p-2 text-success-foreground">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-foreground">Profile Exists</span>
                </div>
                <Badge variant="success">
                  <Check className="mr-1 h-3 w-3" />
                  Verified
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-success/10 p-2 text-success-foreground">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-foreground">Wallet Connected</span>
                </div>
                <Badge variant="success">
                  <Check className="mr-1 h-3 w-3" />
                  Active
                </Badge>
              </div>

              <div className="mt-4 rounded-lg border border-border bg-muted p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <HardDrive className="h-3 w-3" /> Credential Data
                </div>
                <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono text-xs text-muted-foreground">
                  {JSON.stringify(
                    { type: "VerifiableCredential", issuer: "did:idos:123", status: "active" },
                    null,
                    2,
                  )}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Connected Wallets</CardTitle>
            <CardDescription>Wallets linked to your profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    W
                  </div>
                  <div className="truncate font-mono text-sm text-muted-foreground">{ADDRESS}</div>
                </div>
                <Badge variant="info" className="ml-2 shrink-0">
                  Primary
                </Badge>
              </div>
            </div>

            <Button variant="outline" className="w-full">
              Link Another Wallet
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-auto pt-8 text-center">
        <p className="mb-1 text-xs text-muted-foreground">Decentralized Identity powered by</p>
        <div className="text-lg font-bold tracking-tight text-foreground">idOS</div>
      </div>
    </div>
  );
}
