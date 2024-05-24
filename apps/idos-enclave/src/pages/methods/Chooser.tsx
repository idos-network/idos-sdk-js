import { Store } from "@idos-network/idos-store";
import { Button } from "../../components/Button";
import { Heading } from "../../components/Heading";
import { Paragraph } from "../../components/Paragraph";
import type { Method, Mode } from "../App";

export interface ChooserProps {
  mode: Mode;
  setMethod: (method: Method) => void;
}

export interface MethodProps<K = {}> {
  mode: Mode;
  store: Store;
  onSuccess: (result: K) => void;
  onError: (error: Error) => void;
}

export default function Chooser({ setMethod, mode }: ChooserProps) {
  return (
    <div className="flex flex-col space-y-4 px-3 md:px-0">
      {mode === "existing" && (
        <>
          <Heading>Unlock your idOS key</Heading>

          <Paragraph>
            To continue, select the authentication method you chose when creating your idOS profile.
          </Paragraph>
        </>
      )}

      {mode === "new" && (
        <>
          <Heading>Create your idOS key</Heading>

          <Paragraph>
            This ensures your idOS data is safe and encrypted such that only you can read it.
          </Paragraph>

          <Paragraph>
            To continue, please choose your preferred authentication method below.
          </Paragraph>
        </>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button onClick={() => setMethod("password")}>Use a password</Button>
        <Button onClick={() => setMethod("passkey")}>Use a passkey</Button>
      </div>
    </div>
  );
}
