import { describe, expect, it } from "vitest";
import { LocalStorageStore } from "./local.js";

describe("LocalStorageStore", () => {
  describe("pipeCodec", () => {
    it("should encode and decode values correctly", async () => {
      const store = new LocalStorageStore();
      const codecStore = store.pipeCodec<number>({
        encode: (value: number) => value.toString(12),
        decode: (value: string) => Number.parseInt(value, 12),
      });

      await codecStore.set("key1", 42);

      expect(await store.get("key1")).toBe("36");
      expect(await codecStore.get("key1")).toBe(42);
    });

    it("should be chainable", async () => {
      const store = new LocalStorageStore();
      const codecStore = store
        .pipeCodec<string>({
          encode: (value: string) => value.split("").reverse().join(""),
          decode: (value: string) => value.split("").reverse().join(""),
        })
        .pipeCodec<string>({
          encode: (value: string) => `HELLO:${value}`,
          decode: (value: string) => value.replace(/^HELLO:/, ""),
        });

      await codecStore.set("key", "42");

      expect(await store.get("key")).toBe("24:OLLEH"); // cspell:disable-line
      expect(await codecStore.get("key")).toBe("42");
    });
  });
});
