import { type RouteConfig, index, layout, prefix, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("auth", "routes/auth.tsx"),

  ...prefix("callbacks", [
    route("noah", "routes/callbacks/noah.tsx"),
    ...prefix("hifi", [
      route("tos", "routes/callbacks/hifi/tos.tsx"),
    ]),
  ]),

  ...prefix("app", [
    layout("layouts/app.tsx", [
      index("routes/app.tsx"),

      ...prefix("kyc", [
        route("token", "routes/kyc/token.ts"),
        route("data", "routes/kyc/data.ts"),
        route("link", "routes/kyc/link.ts"),
        ...prefix("noah", [
          route("link", "routes/kyc/noah/link.ts"),
        ]),
        ...prefix("hifi", [
          route("tos", "routes/kyc/hifi/tos.ts"),
          route("link", "routes/kyc/hifi/link.ts"),
        ]),
      ]),
    ]),
  ]),
] satisfies RouteConfig;
