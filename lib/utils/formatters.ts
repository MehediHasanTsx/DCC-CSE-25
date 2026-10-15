import { DEFAULT_CURRENCY_SYMBOL } from '@/lib/constants';

/**
 * Format a number as currency.
 * @param amount - The amount to format
 * @param symbol - Currency symbol (default: ৳)
 * @returns Formatted string like "৳8,500"
 */
export function formatCurrency(amount: number, symbol: string = DEFAULT_CURRENCY_SYMBOL): string {
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);
  return `${symbol}${formatted}`;
}

/**
 * Format a date string to a readable format.
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  });
}

/**
 * Format a time string (HH:mm) to 12-hour format.
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  return `${h}:${String(minutes).padStart(2, '0')} ${period}`;
}

/**
 * Generate a UUID v4.
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Calculate percentage with bounds.
 */
export function calcPercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(100, Math.max(0, (value / total) * 100));
}

/**
 * Round to N decimal places.
 */
export function round(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Get a Date object formatted as YYYY-MM-DD in local time without UTC offset skewing.
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a YYYY-MM-DD date string into a local Date object (at 00:00:00 local time).
 */
export function parseLocalDate(dateStr: string): Date {
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return new Date(year, month, day);
}

/**
 * Get today's date as YYYY-MM-DD in local timezone.
 */
export function todayISO(): string {
  return getLocalDateString(new Date());
}

/**
 * Get current day of week in local timezone.
 */
export function getCurrentDay(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
}

/**
 * Generate a Gravatar URL from an email address.
 * Uses SHA-256 hashing (Web Crypto API) for the email hash.
 * Returns null if user does not have a Gravatar account, allowing fallback to default avatar image.
 */
export async function getGravatarUrl(email: string, size: number = 80): Promise<string | null> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return null;
  const encoder = new TextEncoder();
  const data = encoder.encode(trimmed);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  const url = `https://www.gravatar.com/avatar/${hashHex}?d=404&s=${size}`;

  if (typeof window !== 'undefined') {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  return url;
}

/**
 * Synchronous Gravatar URL using a pre-computed hash.
 * For use in rendering when the hash is already known.
 */
export function getGravatarUrlSync(emailHash: string, size: number = 80): string {
  return `https://www.gravatar.com/avatar/${emailHash}?d=404&s=${size}`;
}

