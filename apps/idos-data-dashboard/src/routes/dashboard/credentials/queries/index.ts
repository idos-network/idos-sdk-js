import { createQuery } from "react-query-kit";

import { idos } from "@/lib/idos";
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
