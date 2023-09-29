import { kwil } from "@/lib/db";
import { buildMsg } from "@/lib/queries";
import { castToType } from "@/lib/types";
import { createQuery } from "react-query-kit";

import { Attribute } from "../types";

export const useFetchAttributes = createQuery({
  primaryKey: "attributes",
  queryFn: async () => {
    const tx = await buildMsg("get_attributes");
    return await kwil.call(tx).then((res) => castToType<Attribute[]>(res.data?.result || []));
  },
});
