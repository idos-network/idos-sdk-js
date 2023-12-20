import { createQuery } from "react-query-kit";
import { idOS } from "#/lib/idos";

export const useFetchCurrentUser = createQuery({
  primaryKey: "current-user",
  queryFn: () => idOS.auth.currentUser()
});
