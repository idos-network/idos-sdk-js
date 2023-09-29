import { createQuery } from "react-query-kit";

import { kwil } from "@/lib/db";
import { buildMsg } from "@/lib/queries";
import { castToType } from "@/lib/types";

import { Wallet } from "../types";

export const useFetchWallets = createQuery({
  primaryKey: "wallets",
  queryFn: async () => {
    const tx = await buildMsg("get_wallets");
    return kwil.call(tx).then((res) => castToType<Wallet[]>(res.data?.result || []));
  },
});
