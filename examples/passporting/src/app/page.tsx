import { CircularProgress } from "@heroui/react";
import { Suspense } from "react";

import { MatchingCredential } from "@/components/matching-credential";

export default function Home() {
  return (
    <div className="flex h-full flex-col place-content-center items-center gap-4">
      <Suspense
        fallback={
          <div className="flex h-full flex-col place-content-center items-center gap-2">
            <CircularProgress aria-label="Searching for a matching credential..." />
            <p>Seaching for a matching credential...</p>
          </div>
        }
      >
        <MatchingCredential />
      </Suspense>
    </div>
  );
}
