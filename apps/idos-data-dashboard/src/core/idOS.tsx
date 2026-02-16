import { useSelector } from "@xstate/react";
import invariant from "tiny-invariant";
import { dashboardActor } from "../machines/dashboard.actor";
import { selectLoggedInClient } from "../machines/selectors";

export function useIDOS() {
  const client = useSelector(dashboardActor, selectLoggedInClient);
  invariant(client, "`idOSClient` not initialized or not logged in");
  return client;
}
