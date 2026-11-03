import type { ClaimRow } from "@/lib/claims";

import { Badge } from "@/components/ui/badge";

export function ClaimList({ rows }: { rows: ClaimRow[] }) {
  if (rows.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Claims">
      {rows.map((row) => (
        <li key={row.claim}>
          <Badge variant={row.variant} title={row.source}>
            {row.label}: {row.sourceLabel}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
