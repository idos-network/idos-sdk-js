import { Outlet, useRouteLoaderData } from "react-router";
import { Header } from "~/components/header";
import { Sidebar } from "~/components/sidebar";
import { authMiddleware, userContext } from "~/middlewares/auth.server";
import type { Route } from "./+types/app";

export const middleware = [authMiddleware];

export async function loader({ context }: Route.LoaderArgs) {
  const user = context.get(userContext);
  return { user };
}

export const useUser = () => {
  const data = useRouteLoaderData<typeof loader>("layouts/app");

  if (!data) {
    throw new Error("useUser must be used inside a route which is a child of app/layout");
  }

  return data.user;
};

export default function AppLayout() {
  return (
    <div className="flex min-h-svh">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
