import * as Sentry from "@sentry/react-router";

const isNoRouteMatchMessage = (value) =>
  typeof value === "string" && value.startsWith("No route matches URL ");

const isReactRouterNoRouteMatch = (error) => {
  if (error instanceof Error) {
    return isNoRouteMatchMessage(error.message);
  }

  if (!error || typeof error !== "object") {
    return false;
  }

  return (
    error.status === 404 &&
    error.internal === true &&
    isNoRouteMatchMessage(error.data instanceof Error ? error.data.message : error.data?.message)
  );
};

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.VITE_SENTRY_ENVIRONMENT ?? process.env.VERCEL_ENV ?? "unknown",
  release: process.env.VITE_SENTRY_RELEASE ?? process.env.VERCEL_DEPLOYMENT_ID ?? "unknown",
  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/react-router/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
  tracesSampleRate: 0,
  ignoreErrors: [/^No route matches URL /],
  beforeSend(event, hint) {
    if (isReactRouterNoRouteMatch(hint.originalException)) {
      return null;
    }

    return event;
  },
});
