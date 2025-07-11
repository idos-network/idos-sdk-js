import { index, layout, prefix, type RouteConfig, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("auth", "routes/auth.tsx"),

  route("file", "routes/file.ts"),

  ...prefix("callbacks", [
    route("noah", "routes/callbacks/noah.tsx"),
    ...prefix("hifi", [route("tos", "routes/callbacks/hifi/tos.tsx")]),
  ]),

  ...prefix("app", [
    layout("layouts/app.tsx", [
      index("routes/app.tsx"),

      ...prefix("kyc", [
        route("token", "routes/kyc/token.ts"),
        route("data", "routes/kyc/data.ts"),
        route("link", "routes/kyc/link.ts"),
        ...prefix("noah", [route("link", "routes/kyc/noah/link.ts")]),
        ...prefix("hifi", [
          route("tos", "routes/kyc/hifi/tos.ts"),
          route("link", "routes/kyc/hifi/link.ts"),
          route("account", "routes/kyc/hifi/account.ts"),
          route("status", "routes/kyc/hifi/status.ts"),
        ]),
        ...prefix("monerium", [route("auth", "routes/kyc/monerium/auth.ts")]),
      ]),
    ]),
  ]),
] satisfies RouteConfig;
