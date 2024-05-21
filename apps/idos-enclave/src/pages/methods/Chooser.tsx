import { Store } from "@idos-network/idos-store";
import { Button } from "../../components/Button";
import { Heading } from "../../components/Heading";
import { Paragraph } from "../../components/Paragraph";
import type { Flow, Method } from "../App";

export interface ChooserProps {
  flow: Flow;
  setMethod: (method: Method) => void;
}

export interface MethodProps<K = {}> {
  flow: Flow;
  store: Store;
  onSuccess: (result: K) => void;
  onError: (error: Error) => void;
}

export default function Chooser({ setMethod, flow }: ChooserProps) {
  return (
    <div className="flex flex-col space-y-4">
      {flow === "existing" && (
        <>
          <Heading>Unlock your idOS key</Heading>

          <Paragraph>
            To continue, select the authentication method you chose when creating your idOS profile.
          </Paragraph>
        </>
      )}

      {flow === "new" && (
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

      <div className="flex flex-row items-center justify-around">
        <Button onClick={() => setMethod("password")}>Use a password</Button>
        <Button onClick={() => setMethod("passkey")}>Use a passkey</Button>
      </div>
    </div>
  );
}
