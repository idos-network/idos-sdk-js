import { CredentialCardSkeleton } from "./credential-card-skeleton";

export function CredentialsPending() {
  return (
    <div className="flex flex-1 flex-col items-stretch gap-5">
      <div className="flex h-20 items-center justify-between rounded-xl bg-card p-5">
        <h1 className="block font-bold text-2xl md:text-3xl">Credentials</h1>
      </div>
      <ul className="flex flex-1 flex-col gap-5">
        {Array.from({ length: 3 }, (_, i) => (
          <li key={i} className="list-none">
            <CredentialCardSkeleton />
          </li>
        ))}
      </ul>
    </div>
  );
}
