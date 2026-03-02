import invariant from "tiny-invariant";
import { useSelector } from "../machines/provider";
import { selectLoggedInClient } from "../machines/selectors";

/**
 * Returns the logged-in idOS client. Uses React hooks — only call from a component
 * or hook during render. Do not call from async callbacks (e.g. React Query queryFn);
 * use `useIDOSClient()` in the hook and pass the client into the query instead.
 */
export function useIDOSClient() {
  const client = useSelector(selectLoggedInClient);
  invariant(client, "`idOSClient` not initialized or not logged in");
  return client;
}
