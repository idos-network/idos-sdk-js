import { kwil } from "@/lib/db";
import { buildMsg } from "@/lib/queries";
import { castToType } from "@/lib/types";
import { Utils } from "@kwilteam/kwil-js";
import { createQuery } from "react-query-kit";
import { Credential } from "../types";

export const useFetchCredentials = createQuery({
  primaryKey: "credentials",
  queryFn: async () => {
    const tx = await buildMsg("get_credentials");
    return kwil.call(tx).then((res) => castToType<Credential[]>(res.data?.result || []));
  },
});

export const useFetchCredentialDetails = createQuery<Credential, { id: string }>({
  primaryKey: "credential_details",
  queryFn: async ({ queryKey: [, { id }] }) => {
    const inputs = new Utils.ActionInput().put("$id", id);
    const tx = await buildMsg("get_credential_owned", inputs);
    return await kwil.call(tx).then((res) => castToType<Credential>(res.data?.result?.at(0)));
  },
});
