import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import type { Route } from "./+types/withdraw";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "NeoFinance | idOS Demo" }];
}

import { Landmark } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { NumberField, NumberFieldGroup, NumberFieldInput } from "~/components/ui/number-field";

export default function Withdraw() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Withdraw Funds</h2>
          <p className="text-sm text-muted-foreground">
            Transfer back to your bank account via Noah
          </p>
        </div>
      </div>

      <Card className="mx-auto max-w-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Withdraw to Bank</CardTitle>
          <CardDescription>Enter amount to withdraw</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>You are sending</Label>
            <div className="flex gap-2">
              <NumberField defaultValue={100} className="flex-1">
                <NumberFieldGroup>
                  <NumberFieldInput className="text-left text-lg" />
                </NumberFieldGroup>
              </NumberField>
              <div className="flex items-center justify-center rounded-md border border-input bg-muted px-4 text-sm font-medium">
                USDC
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border bg-card p-1 shadow-sm">
                  <Landmark className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-medium text-foreground">Noah</div>
                  <div className="text-xs text-muted-foreground">SEPA Instant Transfer</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-foreground">&asymp; &euro;92.00</div>
                <div className="text-xs font-medium text-success-foreground">
                  Rate: 1 USDC = &euro;0.92
                </div>
              </div>
            </div>
          </div>

          <Button className="w-full" size="lg">
            Continue with Noah
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
