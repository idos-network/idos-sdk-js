import { redirect, unstable_createContext } from "react-router";
import type { SessionUser } from "~/interfaces";
import { sessionStorage } from "~/providers/sessions.server";
import type { Route } from "../+types/root";

export const userContext = unstable_createContext<SessionUser>();

export const authMiddleware: Route.unstable_MiddlewareFunction = async (
  { context, request },
  next,
) => {
  const session = await sessionStorage.getSession(request.headers.get("cookie"));

  const user = session.get("user");

  if (!user || !user.isAuthenticated) {
    throw await redirect("/");
  }

  context.set(userContext, user);

  await next();
};
