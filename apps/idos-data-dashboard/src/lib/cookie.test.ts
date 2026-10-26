// @vitest-environment jsdom

import * as Sentry from "@sentry/react-router";
import { render, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CookieProvider } from "./cookie";

vi.mock("@sentry/react-router", () => ({
  init: vi.fn(),
  setUser: vi.fn(),
}));

vi.mock("@/core/envFlags.common", () => ({
  COMMON_ENV: {
    SENTRY_DSN: "https://example.ingest.sentry.io/1",
    SENTRY_RELEASE: "test",
    SENTRY_ENVIRONMENT: "test",
  },
}));

vi.mock("@/machines/dashboard/provider", () => ({
  useSelector: () => null,
}));

type BeforeSend = (
  event: {
    tags?: Record<string, string>;
    exception?: {
      values?: Array<{ stacktrace?: { frames?: Array<{ filename?: string }> } }>;
    };
  },
  hint: unknown,
) => { tags?: Record<string, string> } | null;

function registeredBeforeSend(): BeforeSend {
  const beforeSend = vi.mocked(Sentry.init).mock.calls[0]?.[0]?.beforeSend;
  if (!beforeSend) throw new Error("CookieProvider did not register beforeSend");
  return beforeSend as BeforeSend;
}

describe("CookieProvider beforeSend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("cookieConsent", JSON.stringify({ consent: 1, version: "1.0" }));
  });

  it("tags an anonymous script event and returns it", async () => {
    render(createElement(CookieProvider, null, "child"));
    await waitFor(() => expect(Sentry.init).toHaveBeenCalled());

    const event = {
      tags: { environment: "production" },
      exception: { values: [{ stacktrace: { frames: [{ filename: "<anonymous>" }] } }] },
    };

    expect(registeredBeforeSend()(event, {})).toBe(event);
    expect(event.tags).toEqual({ environment: "production", source: "console" });
  });

  it("leaves an app event untagged", async () => {
    render(createElement(CookieProvider, null, "child"));
    await waitFor(() => expect(Sentry.init).toHaveBeenCalled());

    const event = {
      exception: {
        values: [{ stacktrace: { frames: [{ filename: "/assets/app.js" }] } }],
      },
    };

    expect(registeredBeforeSend()(event, {})).toBe(event);
    expect(event).not.toHaveProperty("tags");
  });
});
