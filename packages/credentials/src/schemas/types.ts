/**
 * A value a credential may publish in its unencrypted public notes.
 *
 * A `Date` is accepted here, but public notes travel as JSON: once stored, a `Date` is an
 * ISO string, and every consumer reads it as one.
 */
export type PublicNotesAllowedValues = number | string | Date | undefined;
export type PublicNotes = Record<
  string,
  PublicNotesAllowedValues | Record<string, PublicNotesAllowedValues> | undefined
>;
