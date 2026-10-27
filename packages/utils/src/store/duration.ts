export const setDuration = (days?: number): Date | undefined => {
  const daysNumber =
    !days || Number.isNaN(Number(days)) ? undefined : Number.parseInt(days.toString(), 10);

  if (!daysNumber) {
    return;
  }

  const date = new Date();
  date.setTime(date.getTime() + daysNumber * 24 * 60 * 60 * 1000);
  return date;
};

/** Epoch ms for a stored remember-duration, or null when none is set. Invalid JSON throws. */
export const parseRememberDeadline = (date?: string | null): number | null => {
  if (!date) return null;

  // If the value doesn't decode right, we're going to assume that somebody messed around with it.
  // The absence of a value means `false` today. So, we're following suit on the reasoning: consider it absent.
  // Furthermore, since this is not really a recoverable situation, we're going to clean up that stored value.
  const expires = Date.parse(JSON.parse(date));
  if (Number.isNaN(expires)) return null;

  return expires;
};

export const durationElapsed = (date?: string | null): boolean => {
  const expires = parseRememberDeadline(date);
  return expires !== null && expires < Date.now();
};
