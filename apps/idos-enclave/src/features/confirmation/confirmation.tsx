import DOMPurify from "dompurify";

import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";

export interface ConfirmationProps {
  onSuccess: (result: { confirmed: boolean }) => void;
  origin?: string | null;
  message: string;
}

const sanitize = (html: string) => DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });

export function Confirmation({ onSuccess, origin, message }: ConfirmationProps) {
  return (
    <div className="flex flex-col space-y-5 px-3 md:px-0">
      <Heading>Confirmation request</Heading>

      {origin && (
        <div className="text-sm">
          from:
          <span className="ml-2 font-semibold text-sm">{sanitize(origin)}</span>
        </div>
      )}

      <div className="flex flex-col rounded-md border-2 border-green-400 p-5 font-semibold">
        {sanitize(message)}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Button onClick={() => onSuccess({ confirmed: true })} className="px-10">
          Accept
        </Button>
        <Button
          onClick={() => onSuccess({ confirmed: false })}
          variant="secondary"
          className="px-10"
        >
          Reject
        </Button>
      </div>
    </div>
  );
}
