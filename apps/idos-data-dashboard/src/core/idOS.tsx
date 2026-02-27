import invariant from "tiny-invariant";
import { useSelector } from "../machines/provider";
import { selectLoggedInClient } from "../machines/selectors";

export function getIdOSClient() {
  // Don't use hooks in here, since this is called "outside of react"
  // in queries
  const client = useSelector(selectLoggedInClient);
  invariant(client, "`idOSClient` not initialized or not logged in");
  return client;
}

export function useIDOS() {
  const client = useSelector(selectLoggedInClient);
  invariant(client, "`idOSClient` not initialized or not logged in");
  return client;
}
