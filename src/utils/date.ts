/**
 * Format a date or timestamp to YYYY-MM-DD string
 */
export function toDateString(date: Date | number | string): string {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * Get date string for N days ago
 */
export function daysAgo(days: number): string {
  return toDateString(Date.now() - days * 24 * 60 * 60 * 1000);
}

/**
 * Get today's date as YYYY-MM-DD
 */
export function today(): string {
  return toDateString(new Date());
}

/**
 * Get current datetime as ISO string (for Notion date fields with time)
 */
export function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Get Monday of the week containing the given date
 */
export function getWeekStart(date: Date | string = new Date()): string {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  return toDateString(d);
}

/**
 * Get ISO week number for a date
 */
export function getWeekNumber(dateStr: string): number {
  const date = new Date(dateStr);
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
}

/**
 * Format a week range like "26.01.2026 - 01.02.2026"
 */
export function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  };
  return `${fmt(start)} - ${fmt(end)}`;
}
