import { Outlet, useRouteLoaderData } from "react-router";
import { authMiddleware, userContext } from "~/middlewares/auth";
import type { Route } from "./+types/app";

export const unstable_middleware = [authMiddleware];

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

export default function Home() {
  return <Outlet />;
}
