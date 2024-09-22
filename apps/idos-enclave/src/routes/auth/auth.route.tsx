import { LinkButton } from "../../components/ui/button";
import { Heading } from "../../components/ui/heading";
import { Paragraph } from "../../components/ui/paragraph";
import { useParsedSearchParams } from "../../lib/use-parsed-search-params";
import { PasswordForm } from "../../pages/methods/Password";

function AuthMethodSelector() {
  return (
    <div class="flex flex-col items-center gap-5">
      <Heading>Unlock your idOS key</Heading>
      <Paragraph class="text-center">
        To continue, select the authentication method you chose when creating your idOS profile.
      </Paragraph>
      <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2">
        <LinkButton href="?method=password">Use a Password</LinkButton>
        <LinkButton href="?method=passkey">Use a Passkey</LinkButton>
      </div>
    </div>
  );
}

function AuthMethodRenderer() {
  const { method } = useParsedSearchParams();

  switch (method) {
    case "password":
      return <PasswordForm />;
    case "passkey":
      return <Paragraph>Passkey</Paragraph>;
    default:
      return <AuthMethodSelector />;
  }
}

export function AuthRoute() {
  return <AuthMethodRenderer />;
}
