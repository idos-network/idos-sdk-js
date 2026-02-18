import { useSelector } from "@xstate/react";
import invariant from "tiny-invariant";
import { dashboardActor } from "../machines/dashboard.actor";
import { selectLoggedInClient } from "../machines/selectors";

export function getIdOSClient() {
  const client = selectLoggedInClient(dashboardActor.getSnapshot());
  invariant(client, "`idOSClient` not initialized or not logged in");
  return client;
}

export function useIDOS() {
  const client = useSelector(dashboardActor, selectLoggedInClient);
  invariant(client, "`idOSClient` not initialized or not logged in");
  return client;
}
