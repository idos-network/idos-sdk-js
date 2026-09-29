// @vitest-environment jsdom

import { act, render } from "@testing-library/react";
import { createElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const wallet = vi.hoisted(() => ({
  type: "evm" as string | null,
  address: "0xabc" as string | null,
}));

vi.mock("@sentry/react-router", () => ({ init: vi.fn(), setUser: vi.fn() }));
vi.mock("@/core/envFlags.common", () => ({ COMMON_ENV: { SENTRY_DSN: "https://dsn.example/1" } }));
vi.mock("@/machines/dashboard/selectors", () => ({
  selectWalletType: () => wallet.type,
  selectWalletAddress: () => wallet.address,
}));
vi.mock("@/machines/dashboard/provider", () => ({
  useSelector: (selector: () => unknown) => selector(),
}));

import * as Sentry from "@sentry/react-router";

import { CookieProvider } from "./cookie";

describe("CookieProvider Sentry setup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("cookieConsent", JSON.stringify({ consent: 1, version: "1.0" }));
  });

  it("does not send default PII and clears the user on wallet disconnect", async () => {
    wallet.type = "evm";
    wallet.address = "0xabc";
    const { rerender } = await act(async () => render(createElement(CookieProvider, null)));

    expect(Sentry.init).toHaveBeenCalledWith(expect.objectContaining({ sendDefaultPii: false }));
    expect(Sentry.setUser).toHaveBeenLastCalledWith({ type: "evm", address: "0xabc" });

    wallet.type = null;
    wallet.address = null;
    await act(async () => rerender(createElement(CookieProvider, null)));

    expect(Sentry.setUser).toHaveBeenLastCalledWith(null);
  });
});
