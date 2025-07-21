import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Paragraph } from "@/components/ui/paragraph";
import type { AuthMethod, UIMode } from "@/types";

export interface ChooserProps {
  mode: UIMode;
  allowedAuthMethods: AuthMethod[];
  previouslyUsedAuthMethod: AuthMethod | null;
  setMethod: (method: AuthMethod) => void;
}

export default function Chooser({ mode, allowedAuthMethods, setMethod }: ChooserProps) {
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
        {allowedAuthMethods.includes("password") && (
          <Button id="auth-method-password" onClick={() => setMethod("password")}>
            Use a password
          </Button>
        )}

        {allowedAuthMethods.includes("mpc") && (
          <Button id="auth-method-mpc" onClick={() => setMethod("mpc")}>
            Use MPC
          </Button>
        )}
      </div>
    </div>
  );
}
