import { index, layout, prefix, type RouteConfig, route } from "@react-router/dev/routes";

export default [
  layout("layouts/app.tsx", [
    layout("layouts/dashboard.tsx", [
      index("routes/index.tsx"),
      route("wallets", "routes/wallets.tsx"),
      route("shared-with-others", "routes/shared-with-others.tsx"),
      route("shared-with-me", "routes/shared-with-me.tsx"),
      route("settings", "routes/settings.tsx"),
      ...prefix("api", [
        route("profile", "routes/api/profile.ts"),
        route("login", "routes/api/login.ts"),
        route("session", "routes/api/session.ts"),
        route("keys", "routes/api/keys.ts"),
        route("journeys", "routes/api/journeys.ts"),
        route("developer-credentials", "routes/api/developer-credentials.ts"),
      ]),
      ...prefix("developer", [
        index("routes/developer/index.tsx"),
        route("onboarding", "routes/developer/onboarding.tsx"),
      ]),
    ]),
  ]),
] satisfies RouteConfig;
