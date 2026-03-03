import { index, layout, prefix, type RouteConfig, route } from "@react-router/dev/routes";

export default [
  layout("layouts/app.tsx", [
    layout("layouts/dashboard.tsx", [
      index("routes/index.tsx"),
      route("wallets", "routes/wallets.tsx"),
      route("settings", "routes/settings.tsx"),
      ...prefix("api", [route("profile", "routes/api/profile.ts")]),
    ]),
  ]),
] satisfies RouteConfig;
