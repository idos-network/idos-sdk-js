import type { QueryClient } from "@tanstack/react-query";
import { dashboardActor } from "@/machines/dashboard.actor";
import { selectLoggedInClient } from "@/machines/selectors";

/**
 * Wraps a route loader as a best-effort prefetch.
 * - Skips when the idOS client isn't logged in yet (e.g. initial page load).
 * - Catches all errors silently so the router always renders the route component.
 *   Errors are handled by the route's errorComponent instead.
 */
export function authLoader<T>(fn: (queryClient: QueryClient) => T | Promise<T>) {
  return async ({ context: { queryClient } }: { context: { queryClient: QueryClient } }) => {
    if (!selectLoggedInClient(dashboardActor.getSnapshot())) return;
    try {
      return await fn(queryClient);
    } catch {
      // Best-effort prefetch — errorComponent on the route handles errors.
    }
  };
}
