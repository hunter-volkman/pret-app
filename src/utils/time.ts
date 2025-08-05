import { toZonedTime, format } from 'date-fns-tz';

/**
 * Formats a Date object into a specific string format within a given timezone.
 * @param date The date to format.
 * @param tz The IANA timezone string (e.g., 'America/New_York').
 * @returns A formatted time string like "01:47:17 PM EDT".
 */
export function formatTimeInZone(date: Date, tz: string): string {
  // hh:mm:ss a zzz -> 01:47:17 PM EDT
  return format(toZonedTime(date, tz), 'hh:mm:ss a zzz', { timeZone: tz });
}
