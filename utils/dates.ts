// Formats a Date as YYYY-MM-DD using local time components — matches the
// app's own core/util/iso-week.ts#isoDate, so date-based test fixtures
// (e.g. "make today a holiday") line up with whatever date the app itself
// considers "today" to be.
export function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
