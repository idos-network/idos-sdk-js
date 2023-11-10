import { idOS } from "#/lib/idos";
import { createQuery } from "react-query-kit";

export type Wallet = {
  address: string;
  human_id: string;
  id: string;
  public_key: string;
  message: string;
  signature: string;
};

export const useFetchWallets = createQuery({
  primaryKey: "wallets",
  queryFn: () => idOS.data.list<Wallet>("wallets"),
  retry: true
});
