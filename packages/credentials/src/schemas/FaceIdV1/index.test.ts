import { describe, expect, it } from "vitest";

import { FaceIdV1 } from "./index";

describe("FaceIdV1", () => {
  it("serializes its one field and reports a fixed level", () => {
    const credential = new FaceIdV1()
      .setEnvelope({ id: "https://issuer.example/credentials/123" })
      .setSubject({ faceSignUserId: "11111111-1111-1111-1111-111111111111" });

    expect(credential.level()).toBe("human");
    expect(credential.publicNotes()).toEqual({ type: "pop", level: "human" });

    const serialized = credential.serializeSubject();
    expect(serialized.faceSignUserId).toBe("11111111-1111-1111-1111-111111111111");
    expect(serialized["@context"]).toEqual([FaceIdV1.subjectContext]);

    expect(credential.serializeEnvelope().level).toBe("human");
  });

  it("requires the user id", () => {
    expect(() =>
      new FaceIdV1().setEnvelope({ id: "https://issuer.example/credentials/123" }).checkValidity(),
    ).toThrow(/faceSignUserId/);
  });
});
