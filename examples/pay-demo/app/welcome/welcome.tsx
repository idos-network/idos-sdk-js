import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { useSiwe } from "../providers/siwe-provider";

export function Welcome() {
  const { isAuthenticated, signIn, signOut } = useSiwe();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="space-y-6 p-6">
          <header className="flex flex-col items-center text-center">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
              <span className="font-bold text-xl">N</span>
            </div>
            <h1 className="font-bold text-3xl text-foreground tracking-tight">NeoFinance</h1>
            <p className="mx-auto mt-2 max-w-xs text-muted-foreground text-sm">
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

          <footer className="text-center text-muted-foreground text-xs">
            Powered by <span className="font-medium text-foreground">idOS</span>
          </footer>
        </CardContent>
      </Card>
    </main>
  );
}
