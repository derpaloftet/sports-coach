/**
 * Format a date or timestamp to YYYY-MM-DD string
 * Uses local timezone to avoid UTC conversion issues
 */
export function toDateString(date: Date | number | string): string {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
 * For date strings like "2026-02-08", creates date at noon local time to avoid timezone edge cases
 */
export function getWeekStart(date: Date | string = new Date()): string {
  let d: Date;
  if (typeof date === 'string') {
    // Parse date string as local date at noon to avoid timezone issues
    const [year, month, day] = date.split('-').map(Number);
    d = new Date(year, month - 1, day, 12, 0, 0);
  } else {
    d = new Date(date);
  }
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

/**
 * Get day of week name for a date string (Mon, Tue, etc.)
 */
export function getDayOfWeek(dateStr: string): string {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  // Parse as local date at noon to avoid timezone issues
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day, 12, 0, 0);
  return dayNames[d.getDay()];
}

/**
 * Format a date string to "Day DD.MM" format (e.g., "Sun 08.02")
 */
export function formatDayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day, 12, 0, 0);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = dayNames[d.getDay()];
  const dd = String(day).padStart(2, '0');
  const mm = String(month).padStart(2, '0');
  return `${dayName} ${dd}.${mm}`;
}
