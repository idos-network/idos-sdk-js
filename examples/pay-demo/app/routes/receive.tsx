import { Copy, QrCode } from "lucide-react";

import type { Route } from "./+types/receive";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "NeoFinance | idOS Demo" }];
}

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

const ADDRESS = "0x1a2B3c4D5e6F7890abCdEf1234567890AbCdEf12";

export default function Receive() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground text-2xl font-bold tracking-tight">Receive Crypto</h2>
          <p className="text-muted-foreground text-sm">Share your address to receive funds</p>
        </div>
      </div>

      <Card className="mx-auto max-w-md text-center shadow-sm">
        <CardHeader>
          <CardTitle>Your Wallet Address</CardTitle>
          <CardDescription>Scan or copy to send funds to this wallet</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex justify-center">
            <div className="border-border bg-card flex h-64 w-64 items-center justify-center rounded-xl border p-4 shadow-sm">
              <div className="bg-primary relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg">
                <QrCode className="text-primary-foreground h-32 w-32 opacity-20" />
                <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 gap-1 opacity-10">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div key={`qr-cell-${i}`} className="bg-primary-foreground rounded-[1px]" />
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-card flex h-12 w-12 items-center justify-center rounded-md shadow-md">
                    <div className="text-foreground text-lg font-bold">N</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2 text-left">
              <Label>Ethereum Address</Label>
              <Input
                readOnly
                value={ADDRESS}
                className="bg-muted/50 text-muted-foreground font-mono text-xs"
              />
            </div>

            <Button className="w-full" variant="outline">
              <Copy className="mr-2 h-4 w-4" /> Copy Address
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
