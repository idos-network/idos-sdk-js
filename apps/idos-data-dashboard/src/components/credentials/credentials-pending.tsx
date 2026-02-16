import { CredentialCardSkeleton } from "./credential-card-skeleton";

export function CredentialsPending() {
  return (
    <div className="flex flex-col items-stretch flex-1 gap-5">
      <div className="flex justify-between items-center p-5 h-20 bg-neutral-900 rounded-xl">
        <h1 className="block text-2xl md:text-3xl font-bold">Credentials</h1>
      </div>
      <ul className="flex flex-col gap-5 flex-1">
        {Array.from({ length: 3 }, (_, i) => (
          <li key={i} className="list-none">
            <CredentialCardSkeleton />
          </li>
        ))}
      </ul>
    </div>
  );
}
