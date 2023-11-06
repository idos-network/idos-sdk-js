import { idOS } from "#/lib/idos";
import { createQuery } from "react-query-kit";

export const useFetchCurrentUser = createQuery({
  primaryKey: "current-user",
  queryFn: () => idOS.auth.currentUser()
});
