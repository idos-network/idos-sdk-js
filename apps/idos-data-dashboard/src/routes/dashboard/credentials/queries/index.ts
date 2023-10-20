import { createQuery } from "react-query-kit";

import { idos } from "@/lib/idos";
import { Grant } from "@/lib/types";
import { Credential } from "../types";

export const useFetchCredentials = createQuery({
  primaryKey: "credentials",
  queryFn: async () => {
    return idos.data.list<Credential>("credentials");
  },
});

export const useFetchCredentialDetails = createQuery<Omit<Credential, "shares">, { id: string }>({
  primaryKey: "credential_details",
  queryFn: ({ queryKey: [, { id }] }) => {
    return idos.data.get("credentials", id);
  },
});

export const useFetchCredentialShares = createQuery<Grant[], { owner: string; dataId: string }>({
  primaryKey: "credential-shares",
  queryFn: ({ queryKey: [, { owner, dataId }] }) =>
    idos.grants.list({
      owner,
      dataId,
    }),
});
