import { base85ToFile } from "@idos-network/utils/codecs";
import { describe, expect, it } from "vitest";

import { EddV1 } from "./index";

describe("EddV1", () => {
  it("serializes the edd section with its prefix", () => {
    const credential = new EddV1()
      .setEnvelope({ id: "https://issuer.example/credentials/edd1-123" })
      .setSubject({ id: "https://issuer.example/credentials/edd1-123" })
      .addSection("edd", {
        occupation: "AGRICULTURE",
        sourceOfFundsCategory: "BUSINESS_OWNER",
        sourceOfFundsProofFile: Buffer.from("proof of source of funds"),
      });

    expect(credential.level()).toBe("edd");
    expect(credential.publicNotes()).toEqual({ type: "edd", level: "edd" });

    const serialized = credential.serializeSubject();
    expect(serialized.eddOccupation).toBe("AGRICULTURE");
    expect(serialized.eddSourceOfFundsCategory).toBe("BUSINESS_OWNER");
    expect(base85ToFile(serialized.eddSourceOfFundsProofFile as string)?.toString()).toBe(
      "proof of source of funds",
    );
  });

  it("requires the edd section, and rejects an unknown occupation", () => {
    expect(() =>
      new EddV1()
        .setEnvelope({ id: "https://issuer.example/credentials/edd1-123" })
        .setSubject({ id: "uuid:abc" })
        .checkValidity(),
    ).toThrow(/edd/);

    expect(() => new EddV1().addSection("edd", { occupation: "ASTRONAUT" as never })).toThrow(
      /occupation/,
    );
  });
});
