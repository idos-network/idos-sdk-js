import { type RouteConfig, index, layout, prefix, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("auth", "routes/auth.tsx"),

  ...prefix("app", [
    layout("layouts/app.tsx", [
      index("routes/app.tsx"),

      ...prefix("kyc", [
        route("token", "routes/kyc/token.tsx"),
        route("data", "routes/kyc/data.tsx"),
        route("link", "routes/kyc/link.tsx"),
      ]),
    ]),
  ]),
] satisfies RouteConfig;
