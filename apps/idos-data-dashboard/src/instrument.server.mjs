import * as Sentry from "@sentry/react-router";

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.VITE_SENTRY_ENVIRONMENT ?? process.env.VERCEL_ENV ?? "unknown",
  release: process.env.VITE_SENTRY_RELEASE ?? process.env.VERCEL_DEPLOYMENT_ID ?? "unknown",
  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/react-router/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
  tracesSampleRate: 0,
  ignoreErrors: ["getInternalRouterError"],
});
