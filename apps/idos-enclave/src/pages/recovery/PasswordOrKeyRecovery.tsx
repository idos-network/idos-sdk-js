import { Button } from "../../components/ui/button";
import { Heading } from "../../components/ui/heading";

export function PasswordOrKeyRecovery() {
  return (
    <div class="flex flex-col gap-4">
      <Heading>Forgot your password or secret key?</Heading>
      <Button>Recover Google Drive Backup</Button>
      <Button>Recover using Lit Protocol</Button>
    </div>
  );
}
