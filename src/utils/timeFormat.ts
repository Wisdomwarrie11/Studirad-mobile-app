/**
 * Converts 24-hour clock expressions (e.g. "17:00 - 19:00 WAT", "18:30 BST", "09:15")
 * into standard 12-hour AM/PM strings (e.g. "5:00 PM - 7:00 PM WAT", "6:30 PM BST", "9:15 AM").
 * Expressions already containing AM or PM are preserved cleanly.
 */
export function formatTime12h(value?: string | null): string {
  if (!value) return '';
  const raw = String(value).trim();
  if (!raw) return '';

  return raw.replace(
    /\b([01]?\d|2[0-3]):([0-5]\d)\b(?!\s*(?:am|pm|a\.m\.|p\.m\.))/gi,
    (_match, hStr: string, mStr: string) => {
      const hour24 = Number(hStr);
      const period = hour24 >= 12 ? 'PM' : 'AM';
      const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
      return `${hour12}:${mStr} ${period}`;
    }
  );
}

/**
 * Formats an ISO/timestamp date-time into localized 12-hour display (e.g. "Oct 24, 2026, 5:30 PM").
 */
export function formatDateTime12h(value?: string | number | Date | null): string {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  try {
    return d.toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return d.toLocaleString();
  }
}

/**
 * Formats an ISO/timestamp time-only into localized 12-hour display (e.g. "5:30 PM").
 */
export function formatClockTime12h(value?: string | number | Date | null): string {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  try {
    return d.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return d.toLocaleTimeString();
  }
}
