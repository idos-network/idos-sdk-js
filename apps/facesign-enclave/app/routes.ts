import { index, layout, type RouteConfig, route } from "@react-router/dev/routes";

export default [
  // API resource routes (no layout, no providers)
  route("api/handoff", "routes/api.handoff.ts"),
  route("api/handoff/:sessionId", "routes/api.handoff.$sessionId.ts"),

  // Mobile handoff page (standalone, no enclave providers)
  route("m/:sessionId", "routes/m.$sessionId.tsx"),

  // Enclave routes (wrapped with KeyStorage + Requests providers)
  layout("routes/_enclave.tsx", [
    index("routes/_index.tsx"),
    route("login", "routes/login.tsx"),
    route("error", "routes/error.tsx"),
    layout("routes/_protected.tsx", [
      route("wallet", "routes/_protected.wallet.tsx"),
      route("session", "routes/_protected.session.tsx"),
      route("sign", "routes/_protected.sign.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
