import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";

import { useSiwe } from "../providers/siwe-provider";

export function Welcome() {
  const { isAuthenticated, signIn, signOut } = useSiwe();

  return (
    <main className="bg-background flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="space-y-6 p-6">
          <header className="flex flex-col items-center text-center">
            <div className="bg-primary text-primary-foreground mb-6 flex h-12 w-12 items-center justify-center rounded-xl shadow-md">
              <span className="text-xl font-bold">N</span>
            </div>
            <h1 className="text-foreground text-3xl font-bold tracking-tight">NeoFinance</h1>
            <p className="text-muted-foreground mx-auto mt-2 max-w-xs text-sm">
              The modern way to hold, move, and grow your money with complete freedom.
            </p>
          </header>

          <Button
            className="w-full"
            size="lg"
            onClick={() => (isAuthenticated ? signOut() : signIn())}
          >
            {isAuthenticated ? "Disconnect" : "Connect Wallet"}
          </Button>

          <footer className="text-muted-foreground text-center text-xs">
            Powered by <span className="text-foreground font-medium">idOS</span>
          </footer>
        </CardContent>
      </Card>
    </main>
  );
}
