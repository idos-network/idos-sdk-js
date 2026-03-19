import { index, layout, prefix, type RouteConfig, route } from "@react-router/dev/routes";

export default [
  layout("layouts/app.tsx", [
    layout("layouts/dashboard.tsx", [
      index("routes/index.tsx"),
      route("wallets", "routes/wallets.tsx"),
      route("settings", "routes/settings.tsx"),
      route("leaderboard", "routes/leaderboard.tsx"),
      route("community-sale", "routes/community-sale.tsx"),
      ...prefix("api", [
        route("profile", "routes/api/profile.ts"),
        route("leaderboard-position", "routes/api/leaderboard-position.ts"),
        route("sale-data", "routes/api/sale-data.ts"),
      ]),
    ]),
  ]),
] satisfies RouteConfig;
