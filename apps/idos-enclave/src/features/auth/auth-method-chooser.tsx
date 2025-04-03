import type { Store } from "@idos-network/core";

import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Paragraph } from "@/components/ui/paragraph";
import type { AuthMethod, UIMode } from "@/types";

export interface AuthMethodChooserProps {
  mode: UIMode;
  setMethod: (method: AuthMethod) => void;
}

export interface AuthMethodProps<K = Record<string, unknown>> {
  mode: UIMode;
  store: Store;
  onSuccess: (result: K) => void;
  onError: (error: Error) => void;
}

export default function AuthMethodChooser({ setMethod, mode }: AuthMethodChooserProps) {
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
      </div>
    </div>
  );
}
