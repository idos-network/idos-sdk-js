// DevTools snippets and eval report every frame as <anonymous>.
export function isAnonymousScriptEvent(event: {
  exception?: {
    values?: Array<{
      stacktrace?: { frames?: Array<{ filename?: string | null }> } | null;
    }>;
  } | null;
}): boolean {
  const frames = event.exception?.values?.flatMap((value) => value.stacktrace?.frames ?? []) ?? [];
  return frames.length > 0 && frames.every((frame) => frame.filename === "<anonymous>");
}
