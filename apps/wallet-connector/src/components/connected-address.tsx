export function ConnectedAddress({ accountId }: { accountId: string }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-center text-muted-foreground text-sm">Connected as:</p>
      <p className="text-center text-muted-foreground text-sm">
        {accountId.slice(0, 20)}...{accountId.slice(-4)}
      </p>
    </div>
  );
}
