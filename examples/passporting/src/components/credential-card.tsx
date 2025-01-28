import type { idOSCredential } from "@idos-network/idos-sdk";

export function CredentialCard({ credential }: { credential: idOSCredential }) {
  const publicNotes = Object.entries(
    JSON.parse(credential.public_notes ?? "{}") as Record<string, string>,
  ).filter(([key]) => key !== "id");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-stretch gap-4 rounded-md border border-neutral-700 bg-neutral-900 p-6">
        <dl className="flex flex-col items-stretch gap-4">
          {publicNotes.map(([key, value]) => (
            <div
              key={key}
              className="flex items-center justify-between gap-4 border-neutral-700 border-t pt-4 first:border-transparent first:pt-0"
            >
              <dt className="text-gray-200 text-sm capitalize">{key}</dt>
              <dd className="text-green-200 text-sm uppercase">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
