import { base85ToFile, fileToBase85 } from "@idos-network/utils/codecs";
import { z } from "zod";

/*
 * Codecs describe how a field crosses the wire: the encoded (string) side is what a
 * serialized credential subject carries, the decoded side is what schemas and builders
 * work with. `z.decode()` goes flat -> rich, `z.encode()` goes rich -> flat, so a field
 * declares its representation once instead of being sniffed by type at serialization time.
 */

/** `fileToBase85` always emits delimited ascii85; `base85.decode` accepts anything, so check the framing ourselves. */
const ASCII85_FRAMED = /^<~[\s\S]*~>$/;

/** A file carried as ascii85 on the wire, held as a `Buffer` in a credential subject. */
export const Base85File: z.ZodCodec<z.ZodString, z.ZodType<Buffer>> = z.codec(
  z.string(),
  z.instanceof(Buffer),
  {
    decode: (value, ctx) => {
      if (!ASCII85_FRAMED.test(value)) {
        ctx.issues.push({
          code: "custom",
          input: value,
          message: "Invalid base85 file: expected ascii85 delimited by <~ and ~>",
        });

        return z.NEVER;
      }

      const file = base85ToFile(value);

      if (file === false) {
        ctx.issues.push({ code: "custom", input: value, message: "Invalid base85 file" });

        return z.NEVER;
      }

      return file;
    },
    encode: (file) => fileToBase85(file),
  },
);

/** A date carried as an ISO 8601 string on the wire, held as a `Date` in a credential subject. */
export const IsoDate: z.ZodCodec<z.ZodISODateTime, z.ZodDate> = z.codec(
  z.iso.datetime(),
  z.date(),
  {
    decode: (value) => new Date(value),
    encode: (date) => date.toISOString(),
  },
);
