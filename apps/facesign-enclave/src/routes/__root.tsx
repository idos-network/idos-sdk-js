import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { RequestsContextProvider } from "@/providers/requests.provider";

export interface AuthContext {
  isKeyAvailable: boolean;
}

export const Route = createRootRouteWithContext<{
  auth: AuthContext;
}>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <RequestsContextProvider>
      <div className="min-h-svh">
        <Outlet />
      </div>
    </RequestsContextProvider>
  );
}
