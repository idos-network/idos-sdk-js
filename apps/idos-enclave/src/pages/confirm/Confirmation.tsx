import DOMPurify from "dompurify";
import { Heading } from "../../components/heading";
import { Button } from "../../components/button";

export interface ConfirmationProps {
  onSuccess: (result: { confirmed: boolean }) => void;
  origin?: string | null;
  message: string;
}

const sanitize = (html: string) => DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });

export default function Confirmation({ onSuccess, origin, message }: ConfirmationProps) {
  return (
    <div className="flex flex-col space-y-5 px-3 md:px-0">
      <Heading>Confirmation request</Heading>

      {origin && (
        <div className="text-sm">
          from:
          <span className="text-sm font-semibold ml-2">{sanitize(origin)}</span>
        </div>
      )}

      <div className="flex flex-col border-2 border-green-400 rounded-md p-5 font-semibold">
        {sanitize(message)}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
