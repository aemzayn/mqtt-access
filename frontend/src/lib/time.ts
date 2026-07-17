export function formatTimeMs(tsMs: number): string {
  const d = new Date(tsMs);
  const ms = String(d.getMilliseconds()).padStart(3, "0");
  const base = d.toLocaleTimeString();
  const match = base.match(/^(.*\d)(\s*[^\d\s].*)?$/);
  if (match) {
    return `${match[1]}.${ms}${match[2] ?? ""}`;
  }
  return `${base}.${ms}`;
}
