import { index, layout, prefix, type RouteConfig, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("auth", "routes/auth.tsx"),

  route("file", "routes/file.ts"),

  ...prefix("callbacks", [
    route("noah", "routes/callbacks/noah.tsx"),
    route("hifi/tos", "routes/callbacks/hifi/tos.tsx"),
    route("monerium", "routes/callbacks/monerium.tsx"),
  ]),

  ...prefix("app", [
    layout("layouts/app.tsx", [
      index("routes/app.tsx"),
      route("add", "routes/add.tsx"),
      route("withdraw", "routes/withdraw.tsx"),
      route("send", "routes/send.tsx"),
      route("receive", "routes/receive.tsx"),
      route("profile", "routes/profile.tsx"),

      ...prefix("kyc", [
        route("token", "routes/kyc/token.ts"),
        route("credential-status", "routes/kyc/credential-status.ts"),
        route("widget-url", "routes/kyc/widget-url.ts"),
        route("link", "routes/kyc/link.ts"),
        ...prefix("noah", [route("link", "routes/kyc/noah/link.ts")]),
        ...prefix("hifi", [
          route("tos", "routes/kyc/hifi/tos.ts"),
          route("link", "routes/kyc/hifi/link.ts"),
          route("account", "routes/kyc/hifi/account.ts"),
          route("status", "routes/kyc/hifi/status.ts"),
        ]),
        ...prefix("due", [
          route("account", "routes/kyc/due/account.ts"),
          route("confirm", "routes/kyc/due/confirm.ts"),
          route("done", "routes/kyc/due/done.ts"),
        ]),
        ...prefix("monerium", [
          route("auth", "routes/kyc/monerium/auth.ts"),
          route("user", "routes/kyc/monerium/user.ts"),
          route("code", "routes/kyc/monerium/code.ts"),
          route("profile", "routes/kyc/monerium/profile.ts"),
          route("status", "routes/kyc/monerium/status.ts"),
        ]),
      ]),
    ]),
  ]),
] satisfies RouteConfig;
