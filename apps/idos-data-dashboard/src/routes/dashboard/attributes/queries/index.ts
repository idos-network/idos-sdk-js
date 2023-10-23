import { idos } from "@/lib/idos";
import { createQuery } from "react-query-kit";

import { Attribute } from "../types";

export const useFetchAttributes = createQuery({
  primaryKey: "attributes",
  queryFn: async () => {
    return await idos.data.list<Attribute>("attributes");
  }
});
