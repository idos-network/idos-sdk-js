import { describe, expect, it } from "vitest";

import { isAnonymousScriptEvent } from "./anonymous-script-event";

describe("isAnonymousScriptEvent", () => {
  it("drops a stack that is only a console snippet", () => {
    expect(
      isAnonymousScriptEvent({
        exception: { values: [{ stacktrace: { frames: [{ filename: "<anonymous>" }] } }] },
      }),
    ).toBe(true);
  });

  it("keeps an app frame", () => {
    expect(
      isAnonymousScriptEvent({
        exception: {
          values: [
            {
              stacktrace: {
                frames: [{ filename: "<anonymous>" }, { filename: "/assets/app.js" }],
              },
            },
          ],
        },
      }),
    ).toBe(false);
  });

  it("keeps an event with no stack", () => {
    expect(isAnonymousScriptEvent({})).toBe(false);
  });
});
