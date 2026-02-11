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

export const durationElapsed = (date?: string | null): boolean => {
  if (!date) return false;

  // If the value doesn't decode right, we're going to assume that somebody messed around with it.
  // The absence of a value means `false` today. So, we're following suit on the reasoning: consider it absent.
  // Furthermore, since this is not really a recoverable situation, we're going to clean up that stored value.

  const str = JSON.parse(date);

  const expires = Date.parse(str);
  if (Number.isNaN(expires)) {
    return false;
  }

  return expires < Date.now();
};
