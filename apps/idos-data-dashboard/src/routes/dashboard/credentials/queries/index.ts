import { idOS } from "#/lib/idos";
import { createQuery } from "react-query-kit";

export type Credential = {
  credential_type: string;
  human_id: string;
  id: string;
  issuer: string;
  original_id: string;
};

export type CredentialDetails = Credential & {
  content: string;
};

export const useFetchCredentials = createQuery({
  primaryKey: "credentials",
  queryFn: () => idOS.data.list<Credential>("credentials"),
  retry: true
});

export const useFetchCredentialDetails = createQuery<
  CredentialDetails,
  { id: string }
>({
  primaryKey: "credential_details",
  queryFn: ({ queryKey: [, { id }] }) => {
    return idOS.data.get("credentials", id);
  }
});
