import type { Store } from "@idos-network/idos-store";

import { Button } from "../../components/ui/button";
import { Heading } from "../../components/ui/heading";
import { Paragraph } from "../../components/ui/paragraph";
import type { Method, Mode } from "../App";

export interface ChooserProps {
  mode: Mode;
  setMethod: (method: Method) => void;
}

export interface MethodProps<K = Record<string, unknown>> {
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Button id="auth-method-password" onClick={() => setMethod("password")}>
          Use a password
        </Button>
        <Button id="auth-method-passkey" onClick={() => setMethod("passkey")}>
          Use a passkey
        </Button>
        <Button id="auth-method-passkey" onClick={() => setMethod("lit")}>
          Use a signature
        </Button>
      </div>
    </div>
  );
}
