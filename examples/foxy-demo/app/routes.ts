import { type RouteConfig, index, layout, prefix, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("auth", "routes/auth.tsx"),

  ...prefix("app", [
    layout("layouts/app.tsx", [
      index("routes/app.tsx"),

      ...prefix("kyc", [
        route("token", "routes/kyc/token.ts"),
        route("data", "routes/kyc/data.ts"),
        route("link", "routes/kyc/link.ts"),
        route("noah", "routes/kyc/noah.ts"),
      ]),
    ]),
  ]),
] satisfies RouteConfig;
