import { index, layout, prefix, type RouteConfig, route } from "@react-router/dev/routes";

export default [
  layout("layouts/app.tsx", [
    layout("layouts/dashboard.tsx", [
      index("routes/index.tsx"),
      route("wallets", "routes/wallets.tsx"),
      route("shared-with-others", "routes/shared-with-others.tsx"),
      route("shared-with-me", "routes/shared-with-me.tsx"),
      route("settings", "routes/settings.tsx"),
      route("leaderboard", "routes/leaderboard.tsx"),
      ...prefix("api", [
        route("profile", "routes/api/profile.ts"),
        route("leaderboard-position", "routes/api/leaderboard-position.ts"),
      ]),
    ]),
  ]),
] satisfies RouteConfig;
