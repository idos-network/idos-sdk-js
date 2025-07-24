import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Paragraph } from "@/components/ui/paragraph";
import type { PasswordMethod, PasswordSetProps } from "@/types";

export interface PasswordSetMethodProps extends PasswordSetProps {
  setMethod: (method: PasswordMethod) => void;
}

export default function PasswordSetMethodChooser({
  setMethod,
  mode,
  onSuccess,
}: PasswordSetMethodProps) {
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
        <Button id="auth-method-password" onClick={() => setMethod("user")}>
          Use a password
        </Button>

        <Button id="auth-method-mpc" onClick={() => onSuccess({ encryptionPasswordMethod: "mpc" })}>
          Use MPC
        </Button>
      </div>
    </div>
  );
}
