import { index, layout, type RouteConfig, route } from "@react-router/dev/routes";

export default [
  layout("layouts/app.tsx", [
    layout("layouts/dashboard.tsx", [
      index("routes/index.tsx"),
      route("wallets", "routes/wallets.tsx"),
      route("settings", "routes/settings.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
