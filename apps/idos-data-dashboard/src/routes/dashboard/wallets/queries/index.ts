import { createQuery } from "react-query-kit";

import { idos } from "@/lib/idos";
import { Wallet } from "../types";

export const useFetchWallets = createQuery({
  primaryKey: "wallets",
  queryFn: async () => {
    return idos.data.list<Wallet>("wallets");
  }
});
