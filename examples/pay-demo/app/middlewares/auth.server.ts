import { createContext, redirect } from "react-router";
import type { SessionUser } from "~/interfaces";
import { sessionStorage } from "~/providers/sessions.server";
import { getUserItem } from "~/providers/store.server";
import type { Route } from "../+types/root";

export const userContext = createContext<SessionUser>();

export const authMiddleware: Route.MiddlewareFunction = async ({ context, request }, next) => {
  const session = await sessionStorage.getSession(request.headers.get("cookie"));

  const user = session.get("user");

  if (!user || !user.isAuthenticated) {
    throw await redirect("/");
  }

  const userItem = await getUserItem(user.address);

  if (!userItem) {
    throw await redirect("/");
  }

  context.set(userContext, {
    ...user,
    ...userItem,
    isAuthenticated: true,
  });

  await next();
};
