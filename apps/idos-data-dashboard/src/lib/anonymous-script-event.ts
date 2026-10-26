// DevTools, eval, and extension scripts report every frame as <anonymous>.
export function isAnonymousScriptEvent(event: {
  exception?: {
    values?: Array<{
      stacktrace?: { frames?: Array<{ filename?: string | null }> } | null;
    }>;
  } | null;
}): boolean {
  const values = event.exception?.values ?? [];
  return (
    values.length > 0 &&
    values.every((value) => {
      const frames = value.stacktrace?.frames;
      return (
        frames != null &&
        frames.length > 0 &&
        frames.every((frame) => frame.filename === "<anonymous>")
      );
    })
  );
}
