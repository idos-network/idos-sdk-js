import DOMPurify from "dompurify";
import { Button } from "../../components/Button";
import { Heading } from "../../components/Heading";

export interface ConfirmationProps {
  onSuccess: (result: boolean) => void;
  origin?: string | null;
  message: string;
}

const sanitize = (html: string) => DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });

export default function Confirmation({ onSuccess, origin, message }: ConfirmationProps) {
  return (
    <div className="flex flex-col space-y-5">
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

      <div className="flex flex-row items-center justify-around">
        <Button onClick={() => onSuccess(true)} className="px-10">
          Accept
        </Button>
        <Button onClick={() => onSuccess(false)} variant="secondary" className="px-10">
          Reject
        </Button>
      </div>
    </div>
  );
}
