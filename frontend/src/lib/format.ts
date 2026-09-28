const LOCALE = "es-CO";
const fixedFormats = new Map<number, Intl.NumberFormat>();

export function formatNumber(value: number, decimals = 2): string {
  let format = fixedFormats.get(decimals);
  if (!format) {
    format = new Intl.NumberFormat(LOCALE, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    fixedFormats.set(decimals, format);
  }
  return format.format(value);
}

const inputFormat = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 4 });

/** Echo a user-entered value without padding zeros (0,02 stays 0,02). */
export function formatInput(value: number): string {
  return inputFormat.format(value);
}

/** Signed with a real minus sign so columns of coefficients align. */
export function formatSigned(value: number, decimals = 2): string {
  const magnitude = formatNumber(Math.abs(value), decimals);
  return value < 0 ? `−${magnitude}` : `+${magnitude}`;
}

export function formatMetric(value: number): string {
  return formatNumber(value, Math.abs(value) >= 1000 ? 0 : Math.abs(value) >= 10 ? 1 : 3);
}

/** Accepts "0,02" and "0.02"; returns NaN for anything that is not a plain number. */
export function parseDecimal(raw: string): number {
  const text = raw.trim().replace(",", ".");
  if (text.length > 32 || text === "" || !/^[-+]?(\d+\.?\d*|\.\d+)$/.test(text)) return Number.NaN;
  const value = Number(text);
  return Number.isFinite(value) ? value : Number.NaN;
}

const relativeTime = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
];

/** Backend timestamps are naive UTC. */
export function formatRelativeTime(timestamp: string, now = Date.now()): string {
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/i.test(timestamp);
  const seconds = Math.round((Date.parse(hasZone ? timestamp : `${timestamp}Z`) - now) / 1000);
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return relativeTime.format(Math.round(seconds / size), unit);
  }
  return relativeTime.format(seconds, "second");
}
