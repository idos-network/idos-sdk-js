export function timelockToMs(timelock: number): number {
  return timelock * 1000;
}

export function timelockToDate(timelock: number): string {
  if (!timelock) return "No timelock";

  const milliseconds = timelockToMs(timelock);
  const date = new Date(milliseconds);

  if (Number.isNaN(date.getTime())) return timelock.toString();

  return new Intl.DateTimeFormat(["ban", "id"], {
    dateStyle: "short",
    timeStyle: "short",
    hour12: true,
  }).format(date);
}
